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
    question_order = shuffle(index_array(game_data['data'].length));
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
    // Some predefined data
    card_sizes = {"2x2": 4,
        "2x3": 6,
        "3x3": 9};
    // Get data from form
    card_layout_combo = document.getElementById('card_layout');
    card_layout = card_layout_combo.options[card_layout_combo.selectedIndex].value;
    card_size = card_sizes[card_layout];
    max_cards_combo = document.getElementById('max_cards');
    max_cards = Number(max_cards_combo.options[max_cards_combo.selectedIndex].value);
    // Generate a set of cards
    cards = make_cards(game_data['data'].length, card_size, max_cards);
    // Create html for each card
    var cardset_html = [`<div class="gl-cards">`];
    cards.forEach((card) => {
        card_html = [];
        card_html.push(`<div class="card">`);
        card_html.push(`<div class="card_content layout${card_layout}">`);
        card_questions = card.setBits();
        console.log("Creating html for card " + card_questions);
        card_questions.forEach((question_index) => {
            // TODO use a specified column to draw questions from
            let question = game_data['data'][question_index][0];
            card_html.push(`<div class="carditem">${question}</div>`);
        });
        card_html.push(`</div>`);
        card_hex = card.hex();
        card_html.push(`<div class="card_id">Card ID: ${card_hex}</div>`);
        card_html.push(`</div>`);
        console.log(card_html);
        cardset_html.push(card_html.join("\n"));
    });
    cardset_html.push('</div>');
    gl_write_page_html(cardset_html.join("\n"));
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

// Generate cards, that is, K-combinations
// Some good info here https://cp-algorithms.com/combinatorics/generating_combinations.html
function make_cards(num_questions, card_size, max_cards) {

    function generate_card(length, size) {
        var card = new bitfield(length);
        while (card.numSetBits() < size) {
            n = Math.floor(Math.random() * length);
            card.setBit(n);
        }
        return card;
    }

    function has_dupes(all_cards, new_card) {
        new_card_hex = new_card.hex();
        console.log("Comparing existing cards against " + new_card_hex);
        for (let i=0; i<all_cards.length; i++) {
            if (new_card_hex == all_cards[i].hex()) {
                return true;
            }
        }
        return false;
    }

    // Number of cards to generate - lesser of max_cards and the number of cards possible with num_questions and card_size =
    possible_cards = nCk(num_questions, card_size);
    num_cards = Math.min(max_cards, possible_cards);
    console.log("Gridlock: generating " + num_cards + " cards of size " + card_size);
    let result = [];
    // Create num_cards cards
    for (let i=0; i<num_cards; i++) {
        var new_card = generate_card(num_questions, card_size);
        // TODO Check for duplicates
        while (has_dupes(result, new_card)) {
            console.log("Duplicate found, generating another card");
            new_card = generate_card(num_questions, card_size);
        }
        console.log("Adding card " + new_card.setBits())
        result[i] = new_card;
    }
    return result;
}

function nCk(n, k) {
    // Number of combinations - combinatorics in maths
    // nCk = n!/k!(n-k)!
    // Round because we end up with big floating point numbers and a small fractional part
    return Math.round(factorial(n) /
        (factorial(k) * factorial(n - k)));
}

function factorial(x) {
    if(x < 0)
        return 0;
    var f = 1;
    for(var i = x; i > 1; i--)
        f *= i;
    return f;
}

class bitfield {
    constructor(n) {
        this.data = new Array(n);
        for (let i=0; i<n; i++) {
            this.data[i] = false;
        }
    }

    numSetBits() {
        // The number of bits that are set
        var bits = 0;
        for (let i=0; i<this.data.length; i++) {
            if (this.data[i]) {
                bits++;
            }
        }
        return bits;
    }

    setBits() {
        // An array of the bit indexes that are set
        var bits = [];
        for (let i=0; i<this.data.length; i++) {
            if (this.data[i]) {
                bits.push(i);
            }
        }
        return bits;
    }

    hex() {
        var hex_lookup = ["0", "1", "2", "3", "4", "5", "6", "7",
            "8", "9", "a", "b", "c", "d", "e", "f"];
        var hexits = [];
        // An array of the bit indexes that are set
        var hex_number = 0;
        for (let i=0; i<this.data.length; i++) {
            let hexit = Math.floor(i/4);
            var bit = Math.floor(i%4);
            if (this.data[i]) {
                hex_number += Math.pow(2, bit);
            }
            if (bit == 3) {
                // TODO not convinced the hex conversion is working right
                // and if the dup detection is working
                // 4 bits for a hexit have been processed
                hexits.push(hex_lookup[hex_number]);
                hex_number = 0;
            }
        }
        return hexits.join("");
    }

    setBit(n) {
        this.data[n] = true;
    }

    resetBit(n) {
        this.data[n] = false;
    }
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
