import fs from 'fs';

let data_folder = "overview/15.4"
let data: {[game_type: string]: object[]} = {}
let champs: {[gameMode: string]: {[champ: string]: {[lane: string]: {"games": number, "wins": number, "losses": number}}}} = {}
let globalWR: {[gameMode: string]: {[champ: string]: {[lane: string]:{[oppChamp: string]: {"games": number, "wins": number, "losses": number}}}}} = {}
let laneWR: {[gameMode: string]: {[champ: string]: {[lane: string]:{[oppChamp: string]: {"games": number, "wins": number, "losses": number}}}}} = {}
let content = fs.readdirSync(data_folder, { withFileTypes: true })

const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

function guessRole(player: Object, players: Object[]){
    if(player['teamPosition'] && player['teamPosition'] != "") return player['teamPosition']

    switch (player['lane']) {
        case "TOP":
            return "TOP";
        case "JUNGLE":
            return "JUNGLE";
        case "MIDDLE":
            return "MIDDLE";
        case "BOTTOM":
            if(player['role'] == "CARRY")
                return "BOTTOM";

            if(player['role'] == "SUPPORT")
                return "UTILITY";
        default:
            break;
    }

    let roles = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]
    players.filter((a) => {a['teamId'] == player['teamId']})

    for(let pl in players){
        let index = roles.indexOf(pl['teamPosition']);
        if(index == -1) continue;
        roles.splice(index, 1);
    }

    if(roles.length != 1) return "";
    return roles[0];
}

function globalInit(){
    if(!champs['global']) champs['global'] = {};
    if(!globalWR['global']) globalWR['global'] = {}
    if(!laneWR['global']) laneWR['global'] = {}
}

function init(mode: string){
    if(!champs[mode]) champs[mode] = {};
    if(!globalWR[mode]) globalWR[mode] = {}
    if(!laneWR[mode]) laneWR[mode] = {}
}
function addChampWinrate(champ: string, lane: string , gameMode: string, win: boolean){
    if(!champs[gameMode][champ]) champs[gameMode][champ] = {}
    if(!champs['global'][champ]) champs['global'][champ]= {}

    if(!champs[gameMode][champ][lane]) champs[gameMode][champ][lane] = {"wins": 0, "losses": 0, "games": 0}
    if(!champs['global'][champ][lane]) champs['global'][champ][lane]= {"wins": 0, "losses": 0, "games": 0}

    champs[gameMode][champ][lane].games++
    if(win) champs[gameMode][champ][lane].wins++
    else champs[gameMode][champ][lane].losses++

    champs['global'][champ][lane].games++
    if(win) champs['global'][champ][lane].wins++
    else champs['global'][champ][lane].losses++
}

function addGlobalWinrate(champ: string, opp_champ: string, lane: string , gameMode: string, win: boolean){
    if(!globalWR[gameMode][champ]) globalWR[gameMode][champ] = {}
    if(!globalWR['global'][champ]) globalWR['global'][champ] = {}

    if(!globalWR[gameMode][champ][lane]) globalWR[gameMode][champ][lane] = {}
    if(!globalWR['global'][champ][lane]) globalWR['global'][champ][lane] = {}

    if(!globalWR[gameMode][champ][lane][opp_champ]) globalWR[gameMode][champ][lane][opp_champ] = {"wins": 0, "losses": 0, "games": 0}
    if(!globalWR['global'][champ][lane][opp_champ]) globalWR['global'][champ][lane][opp_champ] = {"wins": 0, "losses": 0, "games": 0}

    globalWR[gameMode][champ][lane][opp_champ].games++
    if(win) globalWR[gameMode][champ][lane][opp_champ].wins++
    else globalWR[gameMode][champ][lane][opp_champ].losses++

    globalWR['global'][champ][lane][opp_champ].games++
    if(win) globalWR['global'][champ][lane][opp_champ].wins++
    else globalWR['global'][champ][lane][opp_champ].losses++
}

function addLaneWinrate(champ: string, opp_champ: string, lane: string, gameMode: string, win: boolean){
    if(!laneWR[gameMode][champ]) laneWR[gameMode][champ] = {}
    if(!laneWR['global'][champ]) laneWR['global'][champ] = {}

    if(!laneWR[gameMode][champ][lane]) laneWR[gameMode][champ][lane] = {}
    if(!laneWR['global'][champ][lane]) laneWR['global'][champ][lane] = {}

    if(!laneWR[gameMode][champ][lane][opp_champ]) laneWR[gameMode][champ][lane][opp_champ] = {"wins": 0, "losses": 0, "games": 0}
    if(!laneWR['global'][champ][lane][opp_champ]) laneWR['global'][champ][lane][opp_champ] = {"wins": 0, "losses": 0, "games": 0}

    laneWR[gameMode][champ][lane][opp_champ].games++
    if(win) laneWR[gameMode][champ][lane][opp_champ].wins++
    else laneWR[gameMode][champ][lane][opp_champ].losses++

    laneWR['global'][champ][lane][opp_champ].games++
    if(win) laneWR['global'][champ][lane][opp_champ].wins++
    else laneWR['global'][champ][lane][opp_champ].losses++
}

globalInit();

for(let region of dirs){
    console.log(`reading: ${region} data!`)

    let types = fs.readdirSync(`${data_folder}/${region}/`, { withFileTypes: true })
    for (let game_type of types){
        if(game_type.name != "5v5 Draft Pick" && game_type.name != "5v5 Ranked Flex" && game_type.name != "5v5 Ranked Solo") continue;
        data[game_type.name] = [];
        let files = fs.readdirSync(`${data_folder}/${region}/${game_type.name}/`, { withFileTypes: true })
        for(let file of files){
            data[game_type.name].push(JSON.parse(fs.readFileSync(`${data_folder}/${region}/${game_type.name}/${file.name}`, {encoding: "utf-8"})))
        }

        for(let mode in data){
            init(mode)
            for(let game of data[mode]){
                for(let player of game['info']['participants']){
                    addChampWinrate(player['championName'], guessRole(player, game['info']['participants']), mode, player['win'])
                    for(let opp of game['info']['participants']){
                        if(player['teamId'] == opp['teamId']) continue;
                        addGlobalWinrate(player['championName'], opp['championName'], guessRole(player, game['info']['participants']), mode, player['win'])
                        if(guessRole(player, game['info']['participants']) == guessRole(opp, game['info']['participants'])){
                            addLaneWinrate(player['championName'], opp['championName'], guessRole(player, game['info']['participants']), mode, player['win'])
                        }
                    }
                } 
            }
        }
    }
    console.log("Data processed")
}

console.log("All data read!")



for(let mode in champs){
    fs.writeFileSync(`data_lane/${mode}_wbpr.csv`, `Name,Role,Games,Wins,Losses,WR\n`, {flag: "w+"})
    for(let champ in champs[mode]){
        for(let role in champs[mode][champ]){
            fs.writeFileSync(`data_lane/${mode}_wbpr.csv`,`${champ},${role},${champs[mode][champ][role].games},${champs[mode][champ][role].wins},${champs[mode][champ][role].losses},${Math.round((champs[mode][champ][role].wins / champs[mode][champ][role].games) * 10000) / 100}\n`, {flag: "a+"})
        }
    }
}

for(let mode in globalWR){
    fs.writeFileSync(`data_lane/${mode}_globalWR.csv`, `Name,Role,Opponent,Games,Wins,Losses,WR\n`, {flag: "w+"})
    for(let champ in globalWR[mode]){
        for(let role in champs[mode][champ]){
            for(let opp in globalWR[mode][champ][role]){
                fs.writeFileSync(`data_lane/${mode}_globalWR.csv`,`${champ},${role},${opp},${globalWR[mode][champ][role][opp].games},${globalWR[mode][champ][role][opp].wins},${globalWR[mode][champ][role][opp].losses},${Math.round((globalWR[mode][champ][role][opp].wins / globalWR[mode][champ][role][opp].games) * 10000) / 100}\n`, {flag: "a+"})
            }
        }
    }
}

for(let mode in laneWR){
    fs.writeFileSync(`data_lane/${mode}_laneWR.csv`, `Name,Role,Opponent,Games,Wins,Losses,WR\n`, {flag: "w+"})
    for(let champ in laneWR[mode]){
        for(let role in champs[mode][champ]){
            for(let opp in laneWR[mode][champ][role]){
                fs.writeFileSync(`data_lane/${mode}_laneWR.csv`,`${champ},${role},${opp},${laneWR[mode][champ][role][opp].games},${laneWR[mode][champ][role][opp].wins},${laneWR[mode][champ][role][opp].losses},${Math.round((laneWR[mode][champ][role][opp].wins / laneWR[mode][champ][role][opp].games) * 10000) / 100}\n`, {flag: "a+"})
            }
        }
    }
}