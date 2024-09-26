/* Gridlock - a Javascript bingo game library
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 *
 */

// Initialise global variables
var game_data = {};

// Call this function from the web page the game is displayed in
function gl_run() {
    gl_get_data();
    //gl_audio_load();
    gl_load_game(function () {
        //jquiz_shuffle_quiz();
        //jquiz_start_button();
        document.exitFullscreen(); // Just in case it's still fullscreen
    });
}

// Populate quiz_data from GET parameters
function gl_get_data() {
    params = new URLSearchParams(window.location.search);
    game_data['src'] = params.get("src");
    game_data['title'] = params.get("title");
    console.log("Got the following from the GET string:")
    console.log(game_data)
}

function gl_load_game(callback) {
    // Get the file
    game_data['loaded'] = false;
    rq = new XMLHttpRequest();
    rq.onload = function() {
        console.log("Gridlock: Parsing file for game at " + game_data['src']);
        try {
            game_data['data'] = CSV.parse(this.responseText);
        } catch (e) {
            alert(e);
            console.log("Gridlock: Parse failed with exception " + e);
            return
        }
        console.log("Gridlock: game at " + game_data['src'] + " parsed.");
        callback();
    }
    url_no_cache = game_data['src'] + "?v=" + Date.now();
    rq.open('GET', url_no_cache, true);
    rq.send();
    console.log(game_data);
}

// CSV parser, free to use from https://stackoverflow.com/questions/1293147/how-to-parse-csv-data
var CSV = {
    parse: function(csv, reviver) {
        reviver = reviver || function(r, c, v) { return v; };
        var chars = csv.split(''), c = 0, cc = chars.length, start, end, table = [], row;
        while (c < cc) {
            table.push(row = []);
            while (c < cc && '\r' !== chars[c] && '\n' !== chars[c]) {
                start = end = c;
                if ('"' === chars[c]){
                    start = end = ++c;
                    while (c < cc) {
                        if ('"' === chars[c]) {
                            if ('"' !== chars[c+1]) {
                                break;
                            }
                            else {
                                chars[++c] = ''; // unescape ""
                            }
                        }
                        end = ++c;
                    }
                    if ('"' === chars[c]) {
                        ++c;
                    }
                    while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) {
                        ++c;
                    }
                } else {
                    while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) {
                        end = ++c;
                    }
                }
                row.push(reviver(table.length-1, row.length, chars.slice(start, end).join('')));
                if (',' === chars[c]) {
                    ++c;
                }
            }
            if (end === c-1) {
                row.push(reviver(table.length-1, row.length, ''));
            }
            if ('\r' === chars[c]) {
                ++c;
            }
            if ('\n' === chars[c]) {
                ++c;
            }
        }
        return table;
    },

    stringify: function(table, replacer) {
        replacer = replacer || function(r, c, v) { return v; };
        var csv = '', c, cc, r, rr = table.length, cell;
        for (r = 0; r < rr; ++r) {
            if (r) {
                csv += '\r\n';
            }
            for (c = 0, cc = table[r].length; c < cc; ++c) {
                if (c) {
                    csv += ',';
                }
                cell = replacer(r, c, table[r][c]);
                if (/[,\r\n"]/.test(cell)) {
                    cell = '"' + cell.replace(/"/g, '""') + '"';
                }
                csv += (cell || 0 === cell) ? cell : '';
            }
        }
        return csv;
    }
};
