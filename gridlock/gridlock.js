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
    gl_load_game(gl_set_up_game);
}

function gl_set_up_game() {
    //Create all the game cards
    //These are all the mathematical combinations of the game data
    //Cards are created using indexes into the data, rather than the data itself.
    prompt_order = shuffle(index_array(game_data['data'].length));
    gl_show_buttons();
    document.exitFullscreen(); // Just in case it's still fullscreen
}

// Populate quiz_data from GET parameters
function gl_get_data() {
    params = new URLSearchParams(window.location.search);
    game_data['src'] = params.get("src");
    game_data['title'] = params.get("title");
    console.log("Got the following from the GET string:")
}

function gl_load_game(callback) {
    // Get the file
    game_data['loaded'] = false;
    rq = new XMLHttpRequest();
    rq.onload = function() {
        console.log("Gridlock: Parsing file for game at " + game_data['src']);
        try {
            csv_data = CSV.parse(this.responseText);
        } catch (e) {
            alert(e);
            console.log("Gridlock: Parse failed with exception " + e);
            return
        }
        game_data['columns'] = csv_data[0];
        game_data['data'] = csv_data.slice(1);
        // TODO Don't allow more than 53 entries of game data, because
        // other code can't handle that.
        console.log("Gridlock: column names are ", game_data['columns']);
        console.log("Gridlock: game data is ", game_data['data']);
        console.log("Gridlock: game at " + game_data['src'] + " parsed.");
        callback();
    }
    url_no_cache = game_data['src'] + "?v=" + Date.now();
    rq.open('GET', url_no_cache, true);
    rq.send();
    console.log(game_data);
}

function gl_show_buttons() {
    console.log("Gridlock: Creating buttons for cards and game");
    title = game_data['title'];
    html = `<h1 class="gl-contrast-with-bg gl-title">${title}</h1>
    <input type="button" value="Print game cards" onclick="gl_print_cards();" />
    <input type="button" value="Start game" onclick="gl_start_game();" />
    <div id="gridlock-credits">
        <p><a href="credits.html">Gridlock Credits</a></p>
    </div>
    <div class="gridlock-bottombar">
        <input type="image" class="gridlock-quit" value="quit" onclick="window.close();" />
    </div>`;
    gl_write_page_html(html);
}

function gl_print_cards() {
    // Ask for card layout
    html = `<h1 class="gl-contrast-with-bg gl-title">Print cards for '${title}'</h1>
    <label for="card_layout">Choose a card layout:</label>
    <select name="card_layout" id="card_layout">
          <option value="2x2">2x2</option>
          <option value="2x3">2x3</option>
          <option value="3x3">3x3</option>
    </select>
    <label for="max_cards">Choose a card layout:</label>
    <select name="max_cards" id="max_cards">
          <option value="15">15</option>
          <option value="30">30</option>
          <option value="60">60</option>
    </select>
    <input type="button" value="Print game cards" onclick="gl_generate_cards();" />
    <div class="gridlock-bottombar">
        <input type="image" class="gridlock-quit" value="quit" onclick="window.close();" />
    </div>`;
    gl_write_page_html(html);
}

function gl_generate_cards() {
    // Create cards
    card_sizes = {"2x2": 4,
        "2x3": 6,
        "3x3": 9};
    card_layout_combo = document.getElementById('card_layout');
    card_layout = card_layout_combo.options[card_layout_combo.selectedIndex].value;
    card_size = card_sizes[card_layout];
    max_cards_combo = document.getElementById('max_cards');
    max_cards = Number(max_cards_combo.options[max_cards_combo.selectedIndex].value);
    // TODO START FROM HERE
    game_data['cards'] = combinations(game_data['data'].length, card_size, max_cards);
    print_cards = [];
    game_data['cards'].forEach((card, index) => {
        if (card.length == card_size) {
            print_cards.push(index);
        }
    });
    console.log(print_cards);
}

function gl_start_game() {

}

function gl_write_page_html(html) {
    gridlock_div = document.getElementById('gridlock');
    gridlock_div.innerHTML = html;
}

// Create an array of integers up to n
function index_array(n) {
    return [...Array(n).keys()];
}

// Shuffle function copied over from jquiz
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generate K-combinations
// Some good info here https://cp-algorithms.com/combinatorics/generating_combinations.html
function combinations(num_prompts, card_size, max_cards) {
    // Number of cards to generate - lesser of max_cards and the number of cards possible with num_questions and card_size = n!/k!(n-k)!
    function factorial(x) {
        if(x < 0)
            return 0;
        var f = 1;
        for(var i = x; i > 1; i--)
            f *= i;
        return f;
    }
    function countSetBits(n) {
        // Works up to 53 bits
        // Code from https://stackoverflow.com/questions/43122082/efficiently-count-the-number-of-bits-in-an-integer-in-javascript/57631591#57631591
        return n.toString(2).replace(/0/g,"").length
    }
    // Round because we end up with big floating point numbers and a small fractional part
    possible_cards = Math.round(factorial(num_prompts) /
        (factorial(card_size) * factorial(num_prompts - card_size)));
    num_cards = Math.min(max_cards, possible_cards);
    // Represent all the prompts as a string of bits (ie unsigned int).
    // index zero is on the right (LSB).
    // Thus a game with 30 prompts will have a 30 bit string.
    // Generate random numbers up to 2^n - 1, and check if they have
    // card_size bits set. (This is known as Hamming Weight and also
    // popcount. Stop after num_cards have been found.
    let results = [];
    all_bits_set = Math.pow(2, num_prompts) - 1;
    console.log("Gridlock: generating " + num_cards + " cards");
    while (results.length < num_cards) {
        test_num = Math.floor(Math.random() * all_bits_set);
        if (countSetBits(test_num) == card_size) {
            results.push(test_num);
        }
    }
    console.log(results);
    return results;
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

