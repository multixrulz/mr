let canvas = document.getElementById('matrixcanvas');
let ctx = canvas.getContext('2d');

//make canvas full screen
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

// Mirror left-right
//canvas.setTransform(-1,0, 0, 1, canvas.width, 0);

// Do CSS properties that I just can't apply using CSS
canvas.style.zIndex = -1;
canvas.style.position = "fixed";
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.transform = 'scaleX(-1)';

//Characters to display
//text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
text = "MЇЉЊЋЌЍЎЏБГДЖИЙЛПФЦЧШЩЪЫЭЮЯвджзийклмнптфцчшщъыьэюяѐёђѓєїљњћќѝўџѢѣѧѮѱѲѳҋҌҍҎҏҐґҒғҔҕҖҗҘҙҚқҝҟҡҢңҤҥҩҪҫҬҭҰұҲҳҵҷҹҺҿӁӂӃӄӆӇӈӊӋӌӎӐӑӒӓӔӕӖӗӘәӚӛӜӝӞӟӡӢӣӤӥӦӧӨөӪӫӬӭӮӯӰӱӲӳӴӵӶӷӸӹӺӽӿԀԍԏԐԑԓԚԟԦԧϤϥϫϭｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝⲁⲂⲃⲄΓΔΘΛΞΠЀЁЂЃЄⲉⲊⲋⲌⲍⲏⲑⲓⲕⲗⲙⲛⲜⲝⲡⲧⲩⲫⲭⲯⳁⳈⳉⳋⳤ⳥⳦⳨⳩∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑∓ℇℏ℥Ⅎℷ⩫⨀⨅⨆⨉⨍⨎⨏⨐⨑⨒⨓⨔⨕⨖⨗⨘⨙⨚⨛⨜⨝⨿⩪";
// Convert the string to an array of single characters
text = text.split('');

let font_size = 10;
//Number of columns for the rain
let columns = canvas.width/font_size;

//An array of drops - one per column
let drops = [];

//x below os the x coordinate
//1 = y coordinate of the drops(same for every drop initially)
for(let x = 0; x < columns; x++)
    drops[x] = 1;

//Drawing the characters
function draw(){
    //Black BG for the canvas
    //translucent BG to show trail
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0,0, canvas.width, canvas.height)

    ctx.fillStyle = '#0f6';
    ctx.font = font_size + 'px arial';
    //Looping over drops
    for(let i=0; i<drops.length; i++){
        //a random character to print
        let matrixDrop = text[Math.floor(Math.random()*text.length)];
        //x = i*font_size, y = value of drops[i]*font_size
        ctx.fillText(matrixDrop, i*font_size, drops[i]*font_size);

        //sending the drops back to the top randomly after it as crossd the screen
        //adding randomness to the reset to make the drops scattered on the y axis
        if(drops[i]*font_size > canvas.height && Math.random() > 0.975)
        drops[i] = 0;

        //incrementing y coordinate
        drops[i]++
    }
}

setInterval(draw, 33);
