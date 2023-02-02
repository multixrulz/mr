var students = [];

function load_student_list() {
    json_text =
    json_rq = new XMLHttpRequest();
    json_rq.onload = students_loaded;
    json_rq.open('GET', 'student-data.json', true);
    json_rq.send(null);  // No data needs to be sent along with the
}

function students_loaded() {
    json_text = this.responseText;
    //console.log(json_text);
    students = JSON.parse(json_text);
    //console.log("Students loaded");
}

function load_student() {
    // Get the nickname, and set it on the page heading
    nickname = document.getElementById("nickname_entry").value.trim();

    // Student not found
    nickname_e = document.getElementById("nickname");
    if (nickname == "")
        nickname_e.innerText = nickname + "Enter a nickname";
    else
        nickname_e.innerText = nickname + " doesn't exist";
    // Hide everything
    progress = document.getElementById("progress");
    badges = document.getElementById("badges");
    activities = document.getElementById("activities");
    progress.classList = ["hide"];
    badges.classList = ["hide"];
    activities.classList = ["hide"];

    // Match the student
    for (var i = 0; i < students.length; i++) {
        // Student found
        if (students[i]["nickname"] == nickname) {
            s = students[i];
            // Set name
            nickname_e.innerText = nickname;
            // Set XP
            xp = document.getElementById("XP");
            xp.style.width = s["XP"] + "%";
            // Set badges
            for (var key in s["badges"])
                set_class(key, s["badges"][key]);
            // Set activities
            for (var key in s["activities"])
                set_class(key, s["activities"][key]);
            // Show everything
            progress.classList = [];
            badges.classList = [];
            activities.classList = [];
        }
    }
}

function set_class(id, value) {
    console.log(id, value);
    element = document.getElementById(id);
    if (value == true)
        element.classList = ["active"];
    else
        element.classList = ["inactive"];
}

// Load the student data right away
load_student_list();
