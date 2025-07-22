var base_url = '';
var page_data = [];
var task_group_data = [];
var task_data = [];
var student_data = [];
var timeout;
var page = null;

// Do the work
detect_page();
parse_url();
load_data_files(); // When all files are loaded, the data_loaded() callback continues execution.

// Functions
function detect_page() {
    if (document.getElementById("status") != null) {
        console.log("statuspage: status page found, loading...");
        page = 'status';
    } else if (document.getElementById("leaderboard") != null) {
        console.log("statuspage: leaderboard page found, loading...");
        page = 'leaderboard';
    }
}

function parse_url() {
    params = new URLSearchParams(window.location.search);
    console.log("statuspage: got the following from the GET string:", params);
    base_url = params.get("src");
    console.log("statuspage: Found a base URL of '" + base_url + "'");
    if ((base_url === null) || (base_url === undefined))
        base_url = '';
    student = params.get("student");
    console.log("statuspage: Found a student of '" + student + "'");
}

function load_data_files() {
    load_data_file("page data", "page-data.csv", page_data, data_loaded);
    load_data_file("student data", "student-data.csv", student_data, data_loaded);
    if (page == "status") { // Only need this data for the status page
        load_data_file("task group data", "task-group-data.csv", task_group_data, data_loaded);
        load_data_file("task data", "task-data.csv", task_data, data_loaded);
    }
}

function load_data_file(desc, url, data_array, callback) {
    /*
     *  Get and parse a data file
     */
    data_array['loaded'] = false;
    data_url = base_url + url + "?v=" + Date.now();  // Adding date dets a unique URL to ensure the data gets reloaded
    rq = new XMLHttpRequest();
    rq.onload = function() { // This happens when the data is received
        console.log("statuspage: Parsing file for " + desc + " at " + data_url);
        try {
            lines = this.responseText.split("\n");
            csv_data = CSV.parse(lines.join("\n"));
        } catch (e) {
            alert(e);
            console.log("statuspage: CSV parsing failed with exception " + e);
            return
        }
        data_array['columns'] = csv_data[0];
        data_array['data'] = csv_data.slice(1);
        console.log("statuspage: " + desc + " column names are ", data_array['columns']);
        console.log("statuspage: " + desc + " is ", data_array['data']);
        console.log("statuspage: " + desc + " at " + data_url + " parsed.");
        data_array['loaded'] = true;
        callback();
    }
    rq.open('GET', data_url, true);
    rq.send();
}

function data_loaded() {
    console.log("statuspage: data loaded");
    switch (page) {
        case "status":
            if (page_data['loaded'] && task_group_data['loaded']
                && task_data['loaded'] && student_data['loaded']) {
                console.log("statuspage: all data files are loaded.");
                create_status_page();
            }
            break;
        case "leaderboard":
            if (page_data['loaded'] && student_data['loaded']) {
                console.log("statuspage: all data files are loaded.");
                create_leaderboard_page();
            }
            break;
        default:
            console.log("statuspage: page type " + page + " is not recognised, I'm confused");
            break;
    }
}

function create_status_page() {
    console.log("Creating the status page content");
    // Change the leaderboard button to use the base_url
    element = document.getElementById("leaderboardbutton");
    element.href = "index.html?src=" + base_url;
    /*
     * Use the page data
     */
    var columns = [];
    columns['key'] = page_data['columns'].indexOf('Key');
    columns['value'] = page_data['columns'].indexOf('Value');
    // Defaults
    title = "Student status"
    avatar_theme = "green-blobs";
    theme = "slate";
    // Load actual values
    page_data['data'].forEach((entry) => {
        key = entry[columns['key']];
        value = entry[columns['value']];
        if (key == 'Title')
            title = value;
        if (key == 'Avatar theme')
            avatar_theme = value;
        if (key == 'Theme')
            theme = value;
    });
    // TODO Load up the theme's CSS

    // Update the page title
    title_element = document.getElementById("pagetitle");
    title_element.innerHTML = title;

    /*
     *  Write out a table row for headings
     */
    var html = [];
    html.push(
    `<tr class="headings">
        <td></td>
        <td>E</td>
        <td>D</td>
        <td>C</td>
        <td>B</td>
        <td>A</td>
    </tr>`);
    /*
     *  Write out a table row for each task group
     */
    columns = [];
    columns['active'] = task_group_data['columns'].indexOf('Active');
    columns['current'] = task_group_data['columns'].indexOf('Current');
    columns['code'] = task_group_data['columns'].indexOf('Task group code');
    columns['name'] = task_group_data['columns'].indexOf('Task group name');
    columns['url'] = task_group_data['columns'].indexOf('URL');
    task_group_data['data'].forEach((task_group) => {
        active = task_group[columns['active']];
        current = task_group[columns['current']];
        code = task_group[columns['code']];
        name = task_group[columns['name']];
        url = task_group[columns['url']];
        html.push(task_row_html(active, current, code, name, url));
    });
    studentinfo = document.getElementById("tasks");
    studentinfo.innerHTML = html.join('\n');

    /*
     *  Populate the available tasks
     */
    columns = [];
    columns['code'] = task_data['columns'].indexOf('Task group code');
    columns['grade'] = task_data['columns'].indexOf('Grade');
    columns['url'] = task_data['columns'].indexOf('URL');
    task_data['data'].forEach((task) => {
        code = task[columns['code']];
        grade = task[columns['grade']];
        url = task[columns['url']];
        id = code + '-' + grade;
        element = document.getElementById(id);
        element.innerHTML = `<a href="${url}" target=_blank><img></a>`;
    });

    /*
     * Avatar list button
     */
    element = document.getElementById("avatarlist");
    element.href = "avatars/" + avatar_theme + "/index.html";

    /*
     * Load a particular student's data if supplied
     */
    if (student !== null) {
        element = document.getElementById("nickname_entry");
        element.value = student;
        console.log("statuspage: loading data for student " + student + " that was supplied in the URL");
        load_student();
    }
}

function task_row_html(active, current, code, name, url) {
    // Work out what HTML classes need to be added
    classes = [];
    if (to_bool(active))
        classes.push("active");
    if (to_bool(current))
        classes.push("current");
    class_str = classes.join(' ');
    return `
    <tr id="task-${code}" class="${class_str}">
        <td class="label"><a href="${url}" target=_blank>${code} ­— ${name}</a></td>
        <td id="${code}-E" class="task"></td>
        <td id="${code}-D" class="task"></td>
        <td id="${code}-C" class="task"></td>
        <td id="${code}-B" class="task"></td>
        <td id="${code}-A" class="task"></td>
    </tr>`
}

function queue_load_student() {
    // Load the student after some number of milliseconds.
    // This allows us to keep typing without constant updates.
    clearTimeout(timeout);
    timeout = setTimeout(load_student, 500);
}

function load_student() {
    // Get the nickname, and set it on the page heading
    // Change to lower case
    nickname = document.getElementById("nickname_entry").value.trim();
    nickname = nickname.toLowerCase();

    // Student not found
    nickname_e = document.getElementById("nickname_heading");
    if (nickname == "")
        nickname_e.innerText = nickname + "Enter a nickname";
    else
        nickname_e.innerText = nickname + " doesn't exist";
    nickname_column = student_data['columns'].indexOf('Nickname');
    // Reset the data ready for new data
    remove_all_data();
    // Match the student
    student_data['data'].forEach(student => {
        if (student[nickname_column] == nickname) {
            console.log("statuspage: found student " + nickname + " -- loading data");
            nickname_e.innerText = nickname;
            // This is the student.  Process all the other columns of data
            for (i=0; i<student.length; i++) {
                column = student_data['columns'][i];
                switch (column) {
                    case 'Nickname':
                        break;
                    case 'XP':
                        element = document.getElementById("XP");
                        element.style.width = student[i] + "%";
                        break;
                    case 'Avatar':
                        avatar = document.getElementById("avatar");
                        avatar.src = "avatars/" + avatar_theme + "/" +
                            student[i] + ".svg";
                        break;
                    case 'Average Grade':
                        average = document.getElementById("gradeaveragedark");
                        percent = Number(student[i]) * 20;
                        average.style.clipPath = "inset(0 0 " + percent + "% 0)";
                        break;
                    case 'Final Grade':
                        final = document.getElementById("gradefinaldark");
                        percent = Number(student[i]) * 20;
                        final.style.clipPath = "inset(0 0 " + percent + "% 0)";
                        break;
                    default:
                        element = document.getElementById(column);
                        if (to_bool(student[i])) {
                            element.classList.add("award");
                        }
                }
            }
        }
    });
}

function remove_all_data() {
    for (i=0; i<student_data['columns'].length; i++) {
        column = student_data['columns'][i];
        switch (column) {
            case 'Nickname':
                break;
            case 'XP':
                element = document.getElementById("XP");
                element.style.width = "0%";
                break;
            case 'Avatar':
                avatar = document.getElementById("avatar");
                avatar.src = "avatars/" + avatar_theme + "/1.svg";
                break;
            case 'Average Grade':
                average = document.getElementById("gradeaveragedark");
                average.style.clipPath = "inset(0 0 0 0)";
                break;
            case 'Final Grade':
                final = document.getElementById("gradefinaldark");
                final.style.clipPath = "inset(0 0 0 0)";
                break;
            default:
                element = document.getElementById(column);
                element.classList.remove("award");
                break;
        }
    }
}

function create_leaderboard_page() {
    console.log("Creating the leaderboard page content");
    /*
     * Use the page data
     */
    var columns = [];
    columns['key'] = page_data['columns'].indexOf('Key');
    columns['value'] = page_data['columns'].indexOf('Value');
    // Defaults
    title = "Student status"
    avatar_theme = "green-blobs";
    theme = "slate";
    // Load actual values
    page_data['data'].forEach((entry) => {
        key = entry[columns['key']];
        value = entry[columns['value']];
        if (key == 'Title')
            title = value;
        if (key == 'Avatar theme')
            avatar_theme = value;
        if (key == 'Theme')
            theme = value;
    });
    // TODO Load up the theme's CSS

    // Update the page title
    title_element = document.getElementById("pagetitle")
    title_element.innerHTML = title;

    /*
     *  Write out a table row for headings
     */
    var html = [];
    html.push(
    `<tr class="headings">
        <td>Student</td>
        <td>Average grade</td>
        <td>Final grade</td>
    </tr>`);
    /*
     *  Write out a table row for each student, sorted by average grade
     */
    sorted_students = student_data['data'].toSorted(grade_compare);
    columns = [];
    columns['nickname'] = student_data['columns'].indexOf('Nickname');
    columns['average'] = student_data['columns'].indexOf('Average Grade');
    columns['final'] = student_data['columns'].indexOf('Final Grade');
    sorted_students.forEach((student) => {
        nickname = student[columns['nickname']];
        average = student[columns['average']];
        final = student[columns['final']];
        html.push(student_row_html(nickname, average, final));
    });
    studentinfo = document.getElementById("students");
    studentinfo.innerHTML = html.join('\n');
}

function student_row_html(nickname, average, final) {
    // Work out what HTML classes need to be added
    url = "status.html?src=" + base_url + "&student=" + nickname;
    average = average * 20;
    final = final * 20;
    html = `
    <tr id="${nickname}">
        <td class="nickname"><a href="${url}">${nickname}</a></td>
        <td><div class="grade"><img src="grades/grades-h.svg"><img src="grades/grades-h-dark.svg" style="clip-path: inset(0 0 0 ${average}%);"></div></td>
        <td><div class="grade"><img src="grades/grades-h.svg"><img src="grades/grades-h-dark.svg" style="clip-path: inset(0 0 0 ${final}%);"></div></td>
    </tr>`;
    return html;
}

function grade_compare(student_a, student_b) {
    grade_column = student_data['columns'].indexOf('Final Grade');
    if (student_a[grade_column] == student_b[grade_column]) {
        nickname_column = student_data['columns'].indexOf('Nickname');
        return student_a[nickname_column] > student_b[nickname_column];
    }
    else
        return student_a[grade_column] < student_b[grade_column];
}

function to_bool(bool_string) {
    return Number(bool_string) > 0;
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

