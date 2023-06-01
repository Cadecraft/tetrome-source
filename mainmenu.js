// Added:
/*
v1.1.7
> Fix: uniformly distributed piece choice in bag

v1.1.6
> Perf: reduce getElementById calls per frame
> Perf: move piece data to a constant
> Refactor: clean up code

v1.1.5
> Feat: add drop speed factor
> Feat: add Recovery Challenge (random pieces tower)
> REMOVE opener assists
> UI improvements

v1.1.4
> T-spin detection and B2B fix
> All-clear detection and rewards
> REMOVE the "+5" notification on placing a piece
> Feat: add opener assists
> Feat: add instant soft drop setting
> Fix: prevent clipping on the cheese race
> Fix: link to new cadecraft.github.io
*/

// To do:
/*
> Release v1.1.7
> Improve piece generation (1000+)
> Cheese race - remove sprint score saving?
> Improve rendering efficiency/performance?
> Add bonus stat at the bottom: All Clear Rate
> Improve soft drop/auto drop locking issues and timing
> Improve T-spin detection
> Replace getPieceArray with a direct access of a map

> One day: Publish to web store?
> One day: multiplayer server?
> One day: APM?
*/

// Vars
var test_num = 0;
var animalpha = 0.5;
var mymap = [];
function reset_mymap() {
    mymap = []; // Generate a 10x20 grid with each cell set to 0
    for(let y = 0; y < 20; y++) {
        let thisRow = [];
        for(let x = 0; x < 10; x++) thisRow.push(0);
        mymap.push(thisRow);
    }
}
reset_mymap();
var thisframe = [];
function reset_thisframe() {
    thisframe = []; // Generate a 10x20 grid with each cell set to 0
    for(let y = 0; y < 20; y++) {
        let thisRow = [];
        for(let x = 0; x < 10; x++) thisRow.push(0);
        thisframe.push(thisRow);
    }
}
reset_thisframe();
var scoremsgs = []
var blockpcsimgs = {};
for(let i = 0; i < Object.keys(blockpcs).length; i++) {
    blockpcsimgs[Object.keys(blockpcs)[i]] = document.getElementById(blockpcs[Object.keys(blockpcs)[i]]);
}
// Dbg
var dbg = '';
// Handling
var wasd = false;
var handl_das = 100;
var handl_arr = 20;
var sdf_instant = false;
var gridon = true;
// Timers
var autotimer = 0;
var dastimer = 0;
var arrtimer = 0;
var ppscountertimer = 0;
var cheeseint = 0;
var cheesetimer = 0;
var gravfac = 1; // gravity factor
var flim = true;
// Random
var helpinfo = '';
// Info
var lastrotx = 0;
var lastroty = 0;
var score_score = 0;
var score_highscore = 0;
var score_high40 = 0;
var score_tspins = 0;
var score_b2b = 0;
var score_combo = 0;
var score_lines = 0;
var pps = 0;
var totaltime = 0;
var timeto40 = 0;
var piecesplaced = 0;
var inhold = '';
var usedswap = false;
var waslastleft = false;
var isdead = false;
var level = 1;
var lastpiece = '';
// Reset vars function
function reset_vars() {
    lastrotx = 0;
    lastroty = 0;
    score_score = 0;
    score_tspins = 0;
    score_b2b = 0;
    score_combo = 0;
    score_lines = 0;
    pps = 0;
    totaltime = 0;
    timeto40 = 0;
    piecesplaced = 0;
    inhold = '';
    usedswap = false;
    waslastleft = false;
    isdead = false;
    autotimer = 0;
    dastimer = 0;
    arrtimer = 0;
    ppscountertimer = 0;
    level = 1;
    scoremsgs = []
    lastpiece = '';
}
// Generate all pieces
var gen_thispiece = 0;
var gen_all = [];
var gen_types = ['z', 's', 'i', 'o', 't', 'j', 'l'];
var gen_bag = [];
for(let i = 0; i < 1000; i++) {
    // If the bag has ran out, reset it
    if(gen_bag.length <= 0) {
        gen_bag = [...gen_types];
    }
    // Randomly choose an element from the bag
    var elem = Math.floor(Math.random()*gen_bag.length);
    // Move that element from the bag to the total list
    gen_all.push(gen_bag[elem]);
    gen_bag.splice(elem, 1);
}
// Reset gen function
function reset_gen() {
    gen_thispiece = 0;
    gen_all = [];
    gen_types = ['z', 's', 'i', 'o', 't', 'j', 'l'];
    gen_bag = [];
    for(let i = 0; i < 1000; i++) {
        // If the bag has ran out, reset it
        if(gen_bag.length <= 0) {
            gen_bag = [...gen_types];
        }
        // Randomly choose an element from the bag
        var elem = Math.floor(Math.random()*gen_bag.length);
        // Move that element from the bag to the total list
        gen_all.push(gen_bag[elem]);
        gen_bag.splice(elem, 1);
    }
}

// Key input checks
var keys = {};
window.addEventListener('keydown',
    function(e) {
        var l = e.key.toLowerCase();
        keys[l] = true;
        if(['Space', 'ArrowUp', 'ArrowDown'].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    }, false
);
window.addEventListener('keyup',
    function(e) {
        var l = e.key.toLowerCase();
        keys[l] = false;
    }, false
);

// Statuses
function setstatus(innew) {
    document.getElementById('status').innerText = innew;
}

// Piece class
class Piece {
    constructor(type) {
        // Initial variables
        this.type = type;
        this.rot = 0;
        this.x = 3;
        this.y = 0;
        this.typearray = [];
        // Updates
        this.settypearray(this.type);
    }
    settypearray(newtype) {
        this.type = newtype;
        this.rot = 0;
        this.x = 3;
        this.y = 0;
        this.typearray = pieceArrays[this.type]; //getPieceArray(this.type);
        //dastimer = handl_das;
    }
    drop(dist) {
        for(let i = 0; i < dist; i++) {
            // Increase y
            this.y ++;
            // Check if piece is valid
            if(!ispiecevalid()) {
                this.y --;
                return true;
            }
        }
        return false;
    }
    move(right) {
        if(right) {
            this.x ++;
            if(!ispiecevalid()) {
                this.x --;
            }
        }  
        else {
            this.x --;
            if(!ispiecevalid()) {
                this.x ++;
            }
        }
    }
    rotf(right, eighty) {
        var orig = this.rot;
        if(eighty) {
            this.rot ++;
            if(this.rot > 3) {
                this.rot = 0;
            }
            this.rot ++;
            if(this.rot > 3) {
                this.rot = 0;
            }
            if(ispiecevalid()) return; // Piece is already valid
        }
        else if(right) {
            this.rot ++;
            if(this.rot > 3) {
                this.rot = 0;
            }
            if(ispiecevalid()) return; // Piece is already valid
        }  
        else {
            this.rot --;
            if(this.rot < 0) {
                this.rot = 3;
            }
            if(ispiecevalid()) return; // Piece is already valid
        }
        // Continue trying to move l/r
        this.x ++; // 0 Down
        if(ispiecevalid()) return;
        this.x -= 2;
        if(ispiecevalid()) return;
        this.x ++; // 1 Down
        this.y ++;
        if(ispiecevalid()) return;
        this.x ++;
        if(ispiecevalid()) return;
        this.x -= 2;
        if(ispiecevalid()) return;
        this.x ++; // 2 Down
        this.y ++;
        if(ispiecevalid()) return;
        this.x ++;
        if(ispiecevalid()) return;
        this.x -= 2;
        if(ispiecevalid()) return;
        this.y -= 2;
        this.x ++;
        this.rot = orig;
    }
};

var mypiece = new Piece(gen_all[0]);
gen_thispiece ++;

// Reset all function
function resetall() {
    // Anim
    animalpha = -0.5;
    // Reset
    reset_vars();
    reset_gen();
    mypiece.settypearray(gen_all[0]);
    gen_thispiece ++;
    reset_mymap();
    reset_thisframe();
}

// Load vars
//chrome.storage.local.set({'test1': 'a value...'});
chrome.storage.local.get(['ctrl', 'arr', 'das', 'hi', 'hiforty', 'grid', 'sdf_instant'], function(data) {
    if(data.ctrl != null) {
        wasd = data.ctrl == 'wasd';
    }
    if(data.arr != null) {
        handl_arr = parseFloat(data.arr);
    }
    if(data.das != null) {
        handl_das = parseFloat(data.das);
    }
    if(data.hi != null) {
        score_highscore = parseInt(data.hi);
    }
    if(data.hiforty != null) {
        score_high40 = parseFloat(data.hiforty);
    }
    if(data.grid != null) {
        gridon = (data.grid == 'true');
    }
    if(data.sdf_instant != null) {
        sdf_instant = (data.sdf_instant == 'true');
    }
    document.getElementById('presets').value = 'custom';
})

function ispiecevalid() {
    try {
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                // Individual block - ERR: typearray is undefined when dropping
                if(mypiece.typearray[mypiece.rot][y][x] == 0) {
                    // Not a solid area; do nothing
                }
                else if(x+mypiece.x < 0 || x+mypiece.x >= 10 || y+mypiece.y >= 20) {
                    return false; // Off screen
                }
                else {
                    if(mymap[y+mypiece.y][x+mypiece.x] != 0) {
                        return false; // Clipping
                    }
                }
            }
        }
    }
    catch {
        //document.getElementById('status').innerText = 'ERROR: type='+mypiece.type+' all='+JSON.stringify(gen_all);
    }
    return true; // Valid
}

// Event handlers
document.addEventListener("DOMContentLoaded", function(event) {
    // Buttons
    document.getElementById("set_ctrl").onclick = set_ctrl;
    document.getElementById("set_das").onclick = set_das;
    document.getElementById("set_arr").onclick = set_arr;
    document.getElementById("grid").onclick = set_grid;
    document.getElementById("inst_sdf").onclick = set_sdf_instant;
    document.getElementById("presets").onchange = set_res;
    document.getElementById("lk_guid").onclick = lk_guid;
    document.getElementById("lk_wasd").onclick = lk_wasd;
    document.getElementById("lk_dasarr").onclick = lk_dasarr;
    document.getElementById("clearall").onclick = clearall;
    //document.getElementById("lk_strat").onchange = lk_strat;
    document.getElementById("resets").onclick = resetall;
    document.getElementById('status').innerText = dbg;
    document.getElementById('text1').innerText = 'By Cadecraft | v'+chrome.runtime.getManifest().version;
    // Frame
    document.getElementById('framelim').onchange = framelimchg;
    // Extras
    document.getElementById('cheeseint').onchange = cheeseintchg;
    document.getElementById('gravfac').onchange = gravfacchg;
    document.getElementById('recoverychal').onclick = recoverychalgo;
    // Dbg
    sync();
});

// Notify
function notify() {
    alert('You have been notified.')
}

// Sync
function sync() {
    /*chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "checkForWord" }, function(response) {
            showResults(response);
        })
    })*/
}

// Set text functions
function setTextMain(time, secs, text) {
    var elTime = document.getElementById("time");
    elTime.innerText = time;
    var elSecs = document.getElementById("secs");
    elSecs.innerText = secs;
    var elText = document.getElementById("text1");
    elText.innerText = text;
}

// Timer
var loopms = 5;
var gameinterval = setInterval(function(){
    gameloop();
}, loopms);

// Map functions
function addPieceThisf() {
    for(let y = 0; y < 4; y++) {
        for(let x = 0; x < 4; x++) {
            if(mypiece.typearray[mypiece.rot][y][x] != 0) {
                thisframe[y+mypiece.y][x+mypiece.x] = mypiece.typearray[mypiece.rot][y][x];
            }
        }
    }
}
function addPieceGhost() {
    for(let y = 0; y < 4; y++) {
        for(let x = 0; x < 4; x++) {
            if(mypiece.typearray[mypiece.rot][y][x] != 0) {
                if(thisframe[y+mypiece.y][x+mypiece.x] == 0) {
                    thisframe[y+mypiece.y][x+mypiece.x] = -1;
                }
            }
        }
    }
}
function addPieceMap() {
    for(let y = 0; y < 4; y++) {
        for(let x = 0; x < 4; x++) {
            if(mypiece.typearray[mypiece.rot][y][x] != 0) {
                mymap[y+mypiece.y][x+mypiece.x] = mypiece.typearray[mypiece.rot][y][x];
            }
        }
    }
}

// Gameloop
function gameloop() {
    // Input
    if(!isdead) {
        var landed = input();
    }
    else {
        // Is dead; only input should be restart
        if(keys['r']) {
            keys['r'] = false;
            resetall();
        }
    }
    // Timers and autodrop
    if(!isdead) {
        autotimer += loopms;
        dastimer += loopms;
        arrtimer += loopms;
        ppscountertimer += loopms;
        totaltime += loopms;
        cheesetimer += loopms;
        if(cheeseint > 0) {
            if(cheesetimer >= cheeseint*1000) {
                // Spawn cheese
                cheesetimer = 0;
                var randsel = Math.floor(Math.random()*10)
                for(let y = 0; y < 20; y++) {
                    for(let x = 0; x < 10; x++) {
                        if(y == 19) {
                            if(x == randsel) {
                                mymap[y][x] = 0;
                            }
                            else {
                                mymap[y][x] = -2;
                            }
                        }
                        else {
                            mymap[y][x] = mymap[y+1][x];
                        }
                    }
                }
                // Check for piece clipping; if so, move it up
                if(!(ispiecevalid())) {
                    if(mypiece.y >= 1) {
                        mypiece.y --;
                    }
                }
            }
        }
    }
    if(!landed && autotimer >= (1000/level/gravfac)) {
        autotimer = 0; // Gravity timer
        landed = mypiece.drop(1);
    }
    // Animalpha
    animalpha += 0.02;
    if(animalpha >= 1.0) { animalpha = 1.0; }
    if(animalpha < 0.0) { animalpha = 0.0; }
    // If landed
    if(landed) {
        // Add to map, reset piece to next one, and update vars
        lastpiece = gen_all[gen_thispiece-1];
        var wastspin = false;
        if(mypiece.type=='t' && lastrotx==mypiece.x && lastroty==mypiece.y) {
            wastspin = true;
        }
        addPieceMap();
        mypiece.settypearray(gen_all[gen_thispiece]);
        gen_thispiece ++;
        piecesplaced ++;
        usedswap = false;
        autotimer = 0;
        // Line clearing and scoring
        var origscore = score_score;
        var totalcleared = clearlines();
        score_lines += totalcleared;
        if(totalcleared == 0) {
            // None
            score_score += 5;
            score_combo = 0;
        } else if(totalcleared == 1) {
            // 1; check tspin
            if(wastspin) {
                score_score += 400;
                score_b2b ++;
            }
            else {
                score_score += 100;
                score_b2b = 0;
            }
            score_combo ++;
        } else if(totalcleared == 2) {
            // 2; check tspin
            if(wastspin) {
                score_score += 700;
                score_b2b ++;
            }
            else {
                score_score += 200;
                score_b2b = 0;
            }
            score_combo ++;
        } else if(totalcleared == 3) {
            // 3
            score_score += 400;
            score_b2b = 0;
            score_combo ++;
        } else if(totalcleared >= 4) {
            // 4
            score_score += 700;
            score_b2b ++;
            score_combo ++;
        }
        // Extras
        if(score_combo >= 1 && totalcleared != 0) {
            score_score += 50*(score_combo-1);
        }
        if(score_b2b >= 1 && totalcleared != 0) {
            score_score += 100*(score_b2b-1);
        }
        // All clear detection
        var allcleared = true;
        for(let y = 0; y < mymap.length; y++) { for(let x = 0; x < mymap[0].length; x++) { if(mymap[y][x] != 0) { allcleared = false; } } }
        if(allcleared) {
            // All clear bonus
            score_score += 1000;
        }
        // 40 lines save
        if(score_lines >= 40 && timeto40 == 0 && gravfac == 1) {
            timeto40 = totaltime;
            if(timeto40 < score_high40 || score_high40 == 0) {
                score_high40 = timeto40;
                chrome.storage.local.set({'hiforty': score_high40.toString()});
            }
        }
        // Leveling
        if(Math.floor((score_lines/10)) > level-1) {
            level = Math.floor((score_lines/10));
        }
        // Add score info to display and choose color
        var tcolor = '#5e73b9';
        var draws = true;
        if(score_score-origscore < 20) {
            tcolor = '#5e73b9';
            draws = false;
        }
        else if(score_score-origscore < 400) {
            tcolor = '#8293c9';
        }
        else if(score_score-origscore < 1000) {
            tcolor = '#e6851e';
        }
        else {
            tcolor = '#ffb300';
        }
        if(draws) {
            scoremsgs.push({
                'amt': score_score-origscore,
                'color': tcolor,
                'alpha': 1.5,
                'posx': 82, // 220
                'posy': 88 // 330
            });
        }
        if(gravfac != 1) {
            score_score = 0; // Cannot score with wrong gravity factor
        }
        // Death
        if(!ispiecevalid()) {
            // Game over
            isdead = true;
            usedswap = true;
            // Anim
            animalpha = -0.5;
        }
    }
    // PPS counter - Conversion
    var ppstime = 0.5;
    if(ppscountertimer >= ppstime*1000) {
        pps = piecesplaced/(totaltime/1000);
        ppscountertimer = 0;
    }
    // Highscore test
    if(score_score > score_highscore) {
        score_highscore = score_score;
        chrome.storage.local.set({'hi': score_highscore.toString()});
    }
    // Rendering
    for(let y = 0; y < 20; y++) {
        for(let x = 0; x < 10; x++) {
            thisframe[y][x] = mymap[y][x];
        }
    }
    addPieceThisf();
    // Ghost piece
    var origy = mypiece.y;
    mypiece.drop(20);
    addPieceGhost();
    mypiece.y = origy;
    // DBG
    // Render
    render();
}

function clearlines() {
    var total = 0;
    for(let y = 0; y < 20; y++) {
        var clear = true;
        for(let x = 0; x < 10; x++) {
            if(mymap[y][x] == 0) {
                clear = false;
            }
        }
        if(clear) {
            mymap.splice(y, 1);
            mymap.splice(0, 0, [0,0,0,0,0,0,0,0,0,0]);
            total ++;
        }
    }
    return total;
}

// Render
function render() {
    var canvas = document.getElementById('mainfield');
    var ctx = canvas.getContext('2d');
    // Clear canvas
    ctx.fillStyle = '#1d2029';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Based on alpha
    ctx.globalAlpha = animalpha;
    // Render pieces
    for(let y = 0; y < 20; y++) {
        for(let x = 0; x < 10; x++) {
            var thisblock = thisframe[y][x];
            if(thisblock != 0 && isdead) { thisblock = -2; }
            if(thisblock == 0 && !gridon ) { thisblock = -3; }
            // Opener assist (deprecated)
            /*if(thisblock == 0 && document.getElementById('openeras').value != "none") {
                if(document.getElementById('openeras').value in openerAssistArrays &&
                    openerAssistArrays[document.getElementById('openeras').value][y][x] == 1) {
                    thisblock = -5;
                }
            }*/
            ctx.drawImage(blockpcsimgs[thisblock], 0, 0, 20, 20, x*20, y*20, 20, 20);
        }
    }
    // Render scoremsgs
    for(let i = 0; i < scoremsgs.length; i++) {
        // Update and set alpha
        scoremsgs[i].alpha -= 0.015;
        scoremsgs[i].posy += 0.1;
        if(scoremsgs[i].alpha > 1) {
            ctx.globalAlpha = 1;
        } else { ctx.globalAlpha = scoremsgs[i].alpha; }
        if(scoremsgs[i].alpha <= 0) {
            // Faded fully; do not render
        }
        else {
            // Render text
            ctx.fillStyle = scoremsgs[i].color;
            ctx.font = 'bold 20px arial';
            ctx.fillText('+'+scoremsgs[i].amt, scoremsgs[i].posx, scoremsgs[i].posy);
            // If high level, flash entire board orange/gold
            if(scoremsgs[i].amt >= 1000) {
                ctx.globalAlpha = ctx.globalAlpha/2.5;
            }
            else {
                ctx.globalAlpha = ctx.globalAlpha/5;
            }
            if(scoremsgs[i].amt >= 400) {
                ctx.fillRect(0, 0, 300, 400);
            }
        }
    }
    // Reset alpha after rendering scoremsgs
    ctx.globalAlpha = animalpha;
    // Render scoring
    if(isdead) {
        document.getElementById('score').innerText = 'Block out! Score: '+score_score;
    }
    else {
        if(gravfac != 1) {
            if(document.getElementById('score').innerText != 'Gravity factor changed (unscored)') {
                document.getElementById('score').innerText = 'Gravity factor changed (unscored)';
                document.getElementById('score').style.fontSize = '12px';
            }
        }
        else {
            document.getElementById('score').innerText = 'Score: '+score_score;
            document.getElementById('score').style.fontSize = '20px';
        }
        
    }
    document.getElementById('b2b').innerText = 'B2B: '+score_b2b+'\t\t\tLines: '+score_lines;
    if(timeto40 != 0) {
        document.getElementById('combo').innerText = 'Combo: '+score_combo+'\t\tTime: '+(Math.round(totaltime/10)/100).toFixed(2)+'s'+' (40: '+(Math.round(timeto40/10)/100).toFixed(2)+'s)';
    }
    else {
        document.getElementById('combo').innerText = 'Combo: '+score_combo+'\t\tTime: '+(Math.round(totaltime/10)/100).toFixed(2)+'s';
    }
    document.getElementById('highscore').innerText = 'PPS: '+(Math.round(pps*100)/100).toFixed(2)+'\t\tHighscore: '+score_highscore+' (40: '+(Math.round(score_high40/10)/100).toFixed(2)+'s)';
    // Render settings
    var wasdtxt = 'WASD';
    if(!wasd) {
        wasdtxt = 'Guideline';
    }
    var griddisp = 'Off';
    if(gridon) { griddisp = 'On'; }
    var sdf_instant_disp = "Fast";
    if(sdf_instant) { sdf_instant_disp = "Instant"; }
    document.getElementById('setdisp').innerText = 'CURRENT SETTINGS:\nControls - '
    +wasdtxt+'\nDAS - '+handl_das+'ms\nARR - '+handl_arr+'ms\nGrid - '+griddisp
    +'\nSDF - '+sdf_instant_disp+'\n\nUse the dropdown to choose a preset. Your settings and highscore will be saved.\n\n'
    +helpinfo;
    //+handl_arr+'ms\n\nNote: DAS is the time between your first keypress and when the piece starts automatically moving.\nARR is the speed at which it then moves.';
    // Render next up
    for(let i = 0; i < 6; i++) {
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                var thisblock = pieceArrays[gen_all[gen_thispiece+i]][0][y][x];
                if(thisblock != 0 && isdead) { thisblock = -1; }
                if(thisblock != 0) {
                    ctx.drawImage(blockpcsimgs[thisblock], 0, 0, 15, 15, (x+14)*15, (y+(i*3+1))*15, 15, 15);
                }
            }
        }
    }
    // Render hold
    if(inhold != '') {
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                var thisblock = pieceArrays[inhold][0][y][x];
                if(thisblock != 0) {
                    if(usedswap) { thisblock = -1; }
                    ctx.drawImage(blockpcsimgs[thisblock], 0, 0, 15, 15, Math.round((x+0.5)*15), Math.round((y+0.5)*15), 15, 15);
                }
            }
        }
    }
}

function input() {
    var inputs = [];
    // Get inputs based on control layout
    if(wasd) {
        // WASD
        if(keys['a']) { inputs.push('l'); }
        if(keys['d']) { inputs.push('r'); }
        if(keys['w']) { inputs.push('soft'); }
        if(keys['s']) { inputs.push('hard'); if(flim) { keys['s'] = false; } }
        if(keys[' ']) { inputs.push('hard'); if(flim) { keys[' '] = false; } }
        if(keys['shift']) { inputs.push('hold'); keys['shift'] = false; }
        if(keys['arrowleft']) { inputs.push('rotl'); keys['arrowleft'] = false; }
        if(keys['arrowright']) { inputs.push('rotr'); keys['arrowright'] = false; }
        if(keys['arrowup']) { inputs.push('rot80'); keys['arrowup'] = false; }
        if(keys['r']) { inputs.push('reset'); keys['r'] = false; }
    }
    else {
        // Guideline
        if(keys['arrowleft']) { inputs.push('l'); }
        if(keys['arrowright']) { inputs.push('r'); }
        if(keys['arrowdown']) { inputs.push('soft'); }
        if(keys[' ']) { inputs.push('hard'); if(flim) { keys[' '] = false; } }
        if(keys['arrowup'] || keys['x']) { inputs.push('rotr'); keys['arrowup'] = false; keys['x'] = false; }
        if(keys['shift'] || keys['c']) { inputs.push('hold'); keys['shift'] = false; keys['c'] = false; }
        if(keys['control'] || keys['z']) { inputs.push('rotl'); keys['control'] = false; keys['z'] = false; }
        if(keys['a']) { inputs.push('rot80'); keys['a'] = false; }
        if(keys['r']) { inputs.push('reset'); keys['r'] = false; }
    }
    // Depending on inputs
    if(inputs.includes('hold')) {
        if(!usedswap) {
            usedswap = true;
            if(inhold == '') {
                // Move piece to hold
                inhold = mypiece.type;
                mypiece.settypearray(gen_all[gen_thispiece]);
                gen_thispiece ++;
            }
            else {
                // Swap with hold
                var originhold = inhold;
                inhold = mypiece.type;
                mypiece.settypearray(originhold);
            }
        }
    }
    if(inputs.includes('l')) {
        if(!waslastleft) { dastimer = 0; }
        waslastleft = true;
        if(dastimer == 0) {
            mypiece.move(false);
        }
        else if(dastimer >= handl_das) {
            if(arrtimer >= handl_arr) {
                mypiece.move(false);
                arrtimer = 0;
            }
        }
    }
    else if(inputs.includes('r')) {
        if(waslastleft) { dastimer = 0; }
        waslastleft = false;
        if(dastimer == 0) {
            mypiece.move(true);
        }
        else if(dastimer >= handl_das) {
            if(arrtimer >= handl_arr) {
                mypiece.move(true);
                arrtimer = 0;
            }
        }
    }
    else { dastimer = -1*loopms; }
    if(inputs.includes('rotl')) {
        mypiece.rotf(false, false);
        lastrotx = mypiece.x;
        lastroty = mypiece.y;
    }
    if(inputs.includes('rotr')) {
        mypiece.rotf(true, false);
        lastrotx = mypiece.x;
        lastroty = mypiece.y;
    }
    if(inputs.includes('rot80')) {
        mypiece.rotf(false, true);
        lastrotx = mypiece.x;
        lastroty = mypiece.y;
    }
    if(inputs.includes('soft')) {
        // Based on sdf instant or not
        if(sdf_instant) {
            mypiece.drop(20);
            autotimer = (-1000*level)/4;
        }
        else {
            if(!mypiece.drop(1)) {
                autotimer = (-1000*level)/4;
            }
        }
    }
    if(inputs.includes('hard')) {
        if(mypiece.drop(20)) { return true; }
    }
    if(inputs.includes('reset')) {
        resetall();
    }
    return false;
}

// Saving/loading
function saveData(inname, value) {
    chrome.storage.local.set({inname: value});
}
function loadData(name) {
    var newres;
    try {
        chrome.storage.local.get(name, function(result) {
            // result OR result.key?
            newres = result;
        })
        return newres;
    }
    catch(e) {
        return 'Error retrieving data.'+e;
    }
}

// Settings
function set_ctrl() {
    wasd = !wasd;
    if(wasd) {
        chrome.storage.local.set({'ctrl': 'wasd'});
    }
    else {
        chrome.storage.local.set({'ctrl': 'guid'});
    }
    document.getElementById('presets').value = 'custom';
}
function set_das() {
    handl_das -= 25;
    if(handl_das < 0) {
        handl_das = 300;
    }
    chrome.storage.local.set({'das': handl_das.toString()});
    document.getElementById('presets').value = 'custom';
}
function set_arr() {
    handl_arr -= 10;
    if(handl_arr < 0) {
        handl_arr = 60;
    }
    chrome.storage.local.set({'arr': handl_arr.toString()});
    document.getElementById('presets').value = 'custom';
}
function set_grid() {
    gridon = !gridon;
    if(gridon) {
        chrome.storage.local.set({'grid': 'true'});
    }
    else {
        chrome.storage.local.set({'grid': 'false'});
    }
    document.getElementById('presets').value = 'custom';
}
function set_sdf_instant() {
    sdf_instant = !sdf_instant;
    if(sdf_instant) {
        chrome.storage.local.set({'sdf_instant': 'true'});
    } else {
        chrome.storage.local.set({'sdf_instant': 'false'});
    }
    document.getElementById('presets').value = 'custom';
}
// Reset (preset)
function set_res() {
    var val = document.getElementById('presets').value;
    if(val == 'default') {
        wasd = false;
        handl_das = 100;
        handl_arr = 20;
        sdf_instant = false;
    }
    else if(val == 'beginner') {
        wasd = false;
        handl_das = 200;
        handl_arr = 40;
        sdf_instant = false;
    }
    else if(val == 'wasd') {
        wasd = true;
        handl_das = 100;
        handl_arr = 0;
        sdf_instant = true;
    }
    if(wasd) {
        chrome.storage.local.set({'ctrl': 'wasd'});
    }
    else {
        chrome.storage.local.set({'ctrl': 'guid'});
    }
    chrome.storage.local.set({'das': handl_das.toString()});
    chrome.storage.local.set({'arr': handl_arr.toString()});
    chrome.storage.local.set({'sdf_instant': sdf_instant.toString()});
    // Unfocus for input issues
    document.getElementById('presets').blur();
}
// Clear all data
function clearall() {
    chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        if(error) {}
        window.close();
    })
}
// Framelim
function framelimchg() {
    if(document.getElementById('framelim').checked) {
        // Checked; enforce frame limit
        flim = true;
        /*loopms = 5;
        clearInterval(gameinterval);
        gameinterval = setInterval(function(){
            gameloop();
        }, loopms);*/
    }
    else {
        // Not checked; no frame limit
        flim = false;
        /*loopms = 10;
        clearInterval(gameinterval);
        gameinterval = setInterval(function(){
            gameloop();
        }, loopms);*/
    }
}
// Cheese interval change
function cheeseintchg() {
    // Set value to a number
    try {
        var tryint = parseFloat(document.getElementById('cheeseint').value);
        if(isNaN(tryint)) {
            tryint = 0; //0=nocheese
        }
        document.getElementById('cheeseint').value = tryint;
        cheeseint = tryint;
    }
    catch(err) {
        document.getElementById('cheeseint').value = "";
        cheeseint = 0;
    }
}
// Gravity factor change
function gravfacchg() {
    // Set value to a number
    try {
        var tryfac = parseFloat(document.getElementById('gravfac').value);
        if(isNaN(tryfac)) {
            tryfac = 1; //1=normal
        }
        if(tryfac < 0) {
            tryfac = 0;
        }
        if(tryfac > 64) {
            tryfac = 64;
        }
        document.getElementById('gravfac').value = tryfac;
        gravfac = tryfac;
    }
    catch(err) {

    }
}
// Recovery challenge "Go!" (random pieces tower)
function recoverychalgo() {
    // Fill bottom with random pieces
    for(let i = 0; i < 8; i++) {
        // Choose piece
        let chosenRandomPiece = (['z','t','s','o','l','j','i'])[Math.floor(Math.random()*7)];
        var toaddp = pieceArrays[chosenRandomPiece][0];
        var px = Math.floor(Math.random()*6);
        var py = 2;
        var landed = false;
        while(!landed) {
            // Drop 1
            py += 1;
            for(let y = 0; y < 4; y++) {
                for(let x = 0; x < 4; x++) {
                    if(toaddp[y][x] != 0) {
                        if(y+py >= 20) { landed = true; break; }
                        else if(mymap[y+py][x+px] != 0) { landed = true; break; }
                    }
                    
                }
            }
        }
        py -= 1;
        // Add to the screen
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                if(toaddp[y][x] != 0) {
                    mymap[y+py][x+px] = toaddp[y][x]; //-2;
                }
            }
        }
    }
}

// Links
function lk_guid() { helpinfo = 'Rotate: X/Z/A\nMove: Left/Right arrow\nHard drop: Space\nSoft drop: Down arrow\nHold: C/Shift\nRestart: R'; }
function lk_wasd() { helpinfo = 'Rotate: Left/Right/Up arrow\nMove: A/D\nHard drop: S/Space\nSoft drop: W\nHold: Shift\nRestart: R'; }
function lk_dasarr() { helpinfo = 'DAS or Delay Auto Shift is the delay before a piece automatically moves left or right after input. ARR or Auto Repeat Rate is the speed at which it automatically moves.'; }
function lk_strat() { helpinfo = 'Check the Hard Drop Tetris Wiki for strategies.'; }