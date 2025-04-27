import fs from 'fs';
import {keys} from './championFull.json'
import {data} from './championFull.json'
import type { ChampType } from './ChampionTypes'
let data_folder = "overview/15.4"
let game_data: object[] = []
let champs: {[champ: string]:  {"games": number, "wins": number, "losses": number, bans: number, effectiveBans: 0}} = {}
let globalWR: {[champ: string]: {[oppChamp: string]: {"games": number, "wins": number, "losses": number}}} = {}
let laneWR: {[champ: string]: {[oppChamp: string]: {"games": number, "wins": number, "losses": number}}} = {}
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

function addChampWinrate(champ: string, win: boolean){

    if(!champs[champ]) champs[champ] = {wins: 0, losses: 0, games: 0, bans: 0, effective_bans: 0}
    if(!champs[champ]) champs[champ]= {wins: 0, losses: 0, games: 0, bans: 0, effective_bans: 0}

    champs[champ].games++
    if(win) champs[champ].wins++
    else champs[champ].losses++
}

function addChampBan(champ: string, bans: Array<string>){
    if(!champs[champ]) champs[champ] = {wins: 0, losses: 0, games: 0, bans: 0, effective_bans: 0}
    champs[champ].bans++
    if(!bans.includes(champ)){
        champs[champ].effective_bans++
    }
}

function addGlobalWinrate(champ: string, opp_champ: string, win: boolean){
    if(!globalWR[champ]) globalWR[champ] = {}
    if(!globalWR[champ][opp_champ]) globalWR[champ][opp_champ] = {"wins": 0, "losses": 0, "games": 0}

    globalWR[champ][opp_champ].games++
    if(win) globalWR[champ][opp_champ].wins++
    else globalWR[champ][opp_champ].losses++
}

function addLaneWinrate(champ: string, opp_champ: string, win: boolean){
    if(!laneWR[champ]) laneWR[champ] = {}
    if(!laneWR[champ][opp_champ]) laneWR[champ][opp_champ] = {"wins": 0, "losses": 0, "games": 0}

    laneWR[champ][opp_champ].games++
    if(win) laneWR[champ][opp_champ].wins++
    else laneWR[champ][opp_champ].losses++
}

for(let region of dirs){
    console.log(`reading: ${region} data!`)

    let types = fs.readdirSync(`${data_folder}/${region}/`, { withFileTypes: true })
    game_data = [];
    for (let game_type of types){
        if(game_type.name != "5v5 Draft Pick" && game_type.name != "5v5 Ranked Flex" && game_type.name != "5v5 Ranked Solo") continue;
        
        let files = fs.readdirSync(`${data_folder}/${region}/${game_type.name}/`, { withFileTypes: true })
        for(let file of files){
            game_data.push(JSON.parse(fs.readFileSync(`${data_folder}/${region}/${game_type.name}/${file.name}`, {encoding: "utf-8"})))
        }


        for(let game of game_data){
            let banned: Array<string> = []
            for(let team of game['info']['teams']){
                for(let champ of team['bans']){
                    addChampBan(nameFromID(champ['championId']), banned)
                    banned.push(nameFromID(champ['championId']))
                }
            }

            for(let player of game['info']['participants']){
                addChampWinrate(player['championName'], player['win'])
                for(let opp of game['info']['participants']){
                    if(player['teamId'] == opp['teamId']) continue;
                    addGlobalWinrate(player['championName'], opp['championName'], player['win'])
                    if(guessRole(player, game['info']['participants']) == guessRole(opp, game['info']['participants'])){
                        addLaneWinrate(player['championName'], opp['championName'], player['win'])
                    }
                }
            } 
        } 
    }
    console.log("Data processed")
}

console.log("All data read!")




fs.writeFileSync(`data/wbpr.json`, JSON.stringify(champs), {flag: "w+"})
fs.writeFileSync(`data/globalWR.json`, JSON.stringify(globalWR), {flag: "w+"})
fs.writeFileSync(`data/laneWR.json`, JSON.stringify(laneWR), {flag: "w+"})