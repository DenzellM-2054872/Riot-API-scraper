import fs from 'fs';
import {keys} from './championFull.json'
import {data} from './championFull.json'
import type { ChampType } from './ChampionTypes'
let data_folder = "overview/15.4"
let game_data: {[game_type: string]: object[]} = {}
let champs: {[gameMode: string]: {[champ: string]:  {"games": number, "wins": number, "losses": number, bans: number}}} = {}
let globalWR: {[gameMode: string]: {[champ: string]: {[oppChamp: string]: {"games": number, "wins": number, "losses": number}}}} = {}
let laneWR: {[gameMode: string]: {[champ: string]: {[oppChamp: string]: {"games": number, "wins": number, "losses": number}}}} = {}
let content = fs.readdirSync(data_folder, { withFileTypes: true })

interface KeysType{
    [ID: number]: string
}

interface DataType{
    [champID: string]: ChampType
}

function nameFromID(id: number){
    if(id == -1) return "None"
    const typedKeys = keys as KeysType
    const typedData = data as DataType
    const champID: string = typedKeys[id]
    if(typedData[champID].id == "Fiddlesticks") return "FiddleSticks";
    return typedData[champID].id
}

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
function addChampWinrate(champ: string, gameMode: string, win: boolean){

    if(!champs[gameMode][champ]) champs[gameMode][champ] = {wins: 0, losses: 0, games: 0, bans: 0}
    if(!champs['global'][champ]) champs['global'][champ]= {wins: 0, losses: 0, games: 0, bans: 0}

    champs[gameMode][champ].games++
    if(win) champs[gameMode][champ].wins++
    else champs[gameMode][champ].losses++

    champs['global'][champ].games++
    if(win) champs['global'][champ].wins++
    else champs['global'][champ].losses++
}

function addChampBan(champ: string, gameMode: string){

    if(!champs[gameMode][champ]) champs[gameMode][champ] = {wins: 0, losses: 0, games: 0, bans: 0}
    if(!champs['global'][champ]) champs['global'][champ]= {wins: 0, losses: 0, games: 0, bans: 0}

    champs[gameMode][champ].bans++
    champs['global'][champ].bans++

}

function addGlobalWinrate(champ: string, opp_champ: string, gameMode: string, win: boolean){
    if(!globalWR[gameMode][champ]) globalWR[gameMode][champ] = {}
    if(!globalWR['global'][champ]) globalWR['global'][champ] = {}

    if(!globalWR[gameMode][champ][opp_champ]) globalWR[gameMode][champ][opp_champ] = {"wins": 0, "losses": 0, "games": 0}
    if(!globalWR['global'][champ][opp_champ]) globalWR['global'][champ][opp_champ] = {"wins": 0, "losses": 0, "games": 0}

    globalWR[gameMode][champ][opp_champ].games++
    if(win) globalWR[gameMode][champ][opp_champ].wins++
    else globalWR[gameMode][champ][opp_champ].losses++

    globalWR['global'][champ][opp_champ].games++
    if(win) globalWR['global'][champ][opp_champ].wins++
    else globalWR['global'][champ][opp_champ].losses++
}

function addLaneWinrate(champ: string, opp_champ: string, gameMode: string, win: boolean){
    if(!laneWR[gameMode][champ]) laneWR[gameMode][champ] = {}
    if(!laneWR['global'][champ]) laneWR['global'][champ] = {}

    if(!laneWR[gameMode][champ][opp_champ]) laneWR[gameMode][champ][opp_champ] = {"wins": 0, "losses": 0, "games": 0}
    if(!laneWR['global'][champ][opp_champ]) laneWR['global'][champ][opp_champ] = {"wins": 0, "losses": 0, "games": 0}

    laneWR[gameMode][champ][opp_champ].games++
    if(win) laneWR[gameMode][champ][opp_champ].wins++
    else laneWR[gameMode][champ][opp_champ].losses++

    laneWR['global'][champ][opp_champ].games++
    if(win) laneWR['global'][champ][opp_champ].wins++
    else laneWR['global'][champ][opp_champ].losses++
}
globalInit();
for(let region of dirs){
    console.log(`reading: ${region} data!`)

    let types = fs.readdirSync(`${data_folder}/${region}/`, { withFileTypes: true })
    for (let game_type of types){
        if(game_type.name != "5v5 Draft Pick" && game_type.name != "5v5 Ranked Flex" && game_type.name != "5v5 Ranked Solo") continue;
        game_data[game_type.name] = [];
        let files = fs.readdirSync(`${data_folder}/${region}/${game_type.name}/`, { withFileTypes: true })
        for(let file of files){
            game_data[game_type.name].push(JSON.parse(fs.readFileSync(`${data_folder}/${region}/${game_type.name}/${file.name}`, {encoding: "utf-8"})))
        }

        for(let mode in game_data){
            init(mode)
            for(let game of game_data[mode]){
                for(let team of game['info']['teams']){
                    for(let champ of team['bans']){
                        addChampBan(nameFromID(champ['championId']), mode)
                    }
                }
                for(let player of game['info']['participants']){
                    addChampWinrate(player['championName'], mode, player['win'])
                    for(let opp of game['info']['participants']){
                        if(player['teamId'] == opp['teamId']) continue;
                        addGlobalWinrate(player['championName'], opp['championName'], mode, player['win'])
                        if(guessRole(player, game['info']['participants']) == guessRole(opp, game['info']['participants'])){
                            addLaneWinrate(player['championName'], opp['championName'], mode, player['win'])
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
    fs.writeFileSync(`data/${mode}_wbpr.csv`, `Name,Games,Wins,Losses,Bans,WR\n`, {flag: "w+"})
    for(let champ in champs[mode]){
        fs.writeFileSync(`data/${mode}_wbpr.csv`,`${champ},${champs[mode][champ].games},${champs[mode][champ].wins},${champs[mode][champ].losses},${champs[mode][champ].bans},${Math.round((champs[mode][champ].wins / champs[mode][champ].games) * 10000) / 100}\n`, {flag: "a+"})
    }
}

for(let mode in globalWR){
    fs.writeFileSync(`data/${mode}_globalWR.csv`, `Name,Opponent,Games,Wins,Losses,WR\n`, {flag: "w+"})
    for(let champ in globalWR[mode]){
            for(let opp in globalWR[mode][champ]){
                fs.writeFileSync(`data/${mode}_globalWR.csv`,`${champ},${opp},${globalWR[mode][champ][opp].games},${globalWR[mode][champ][opp].wins},${globalWR[mode][champ][opp].losses},${Math.round((globalWR[mode][champ][opp].wins / globalWR[mode][champ][opp].games) * 10000) / 100}\n`, {flag: "a+"})
            }
        
    }
}

for(let mode in laneWR){
    fs.writeFileSync(`data/${mode}_laneWR.csv`, `Name,Opponent,Games,Wins,Losses,WR\n`, {flag: "w+"})
    for(let champ in laneWR[mode]){
        for(let opp in globalWR[mode][champ]){
            fs.writeFileSync(`data/${mode}_laneWR.csv`,`${champ},${opp},${globalWR[mode][champ][opp].games},${globalWR[mode][champ][opp].wins},${globalWR[mode][champ][opp].losses},${Math.round((globalWR[mode][champ][opp].wins / globalWR[mode][champ][opp].games) * 10000) / 100}\n`, {flag: "a+"})
        }
    }
}