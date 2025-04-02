import fs from 'fs';
import {keys} from './championFull.json'
import {data} from './championFull.json'
import type { ChampType } from './ChampionTypes'

function combinations(arr: string[], k: number, prefix: string[]) {
    if (k == 0) return [prefix];
    return arr.flatMap((v, i) =>
        combinations(arr.slice(i+1), k-1, [...prefix, v])
    );
}
function forceRoles(participants: object[], teamID: number, comp: {[role: string]: string}){
    let roles = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]
    for(let role of roles){
        if(!comp[role]){
            for(let player of participants){
                if(player['teamId'] == teamID){
                    if(player['teamPosition'] == "" || player['teamPosition'] == undefined || player['teamPosition'] == 'Invalid'){
                        comp[role] = player['championName']
                        delete comp['']
                        delete comp['Invalid']
                    }
                }
            }
        }
    }
}

let data_folder = "overview/15.4"


interface Comp{
    "champs": {[role: string]: string},
    "win": boolean,
}

let game_data: Comp[] = []

let content = fs.readdirSync(data_folder, { withFileTypes: true })

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

const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
for(let region of dirs){
    console.log(`reading: ${region} data!`)

    let types = fs.readdirSync(`${data_folder}/${region}/`, { withFileTypes: true })
    for (let game_type of types){
        if(game_type.name != "5v5 Draft Pick" && game_type.name != "5v5 Ranked Flex" && game_type.name != "5v5 Ranked Solo") continue;

        let files = fs.readdirSync(`${data_folder}/${region}/${game_type.name}/`, { withFileTypes: true })
        for(let file of files){
            let data = JSON.parse(fs.readFileSync(`${data_folder}/${region}/${game_type.name}/${file.name}`, {encoding: "utf-8"}))['info']
            let team1: {[role: string]: string} = {}
            let team2: {[role: string]: string} = {}
            for(let player of data['participants']){
                if(player['teamId'] == 100){
                    team1[guessRole(player, data['participants'])] = player['championName']
                }else{
                    team2[guessRole(player, data['participants'])] = player['championName']
                }
            }

            forceRoles(data['participants'], 100, team1)
            forceRoles(data['participants'], 200, team2)

            let count = 0;
            for(let role in team1){
                count++
                if(role == "" || role == undefined)
                    console.log("HOOOOOW????")
            }
            if(count != 5 ){
                console.log("HEH?")
            }
            count = 0;
            for(let role in team2){
                count++
                if(role == "" || role == undefined)
                    console.log("HOOOOOW???? 2")
            }
            if(count != 5 ){
                console.log("HuH?")
            }
            game_data.push({champs: team1, win: data['teams'][0]['win']})
            game_data.push({champs: team2, win: data['teams'][1]['win']})
        }

    }
    console.log("Data processed")
}

console.log("All data read!")

let frequent : {[champs: string]: number[]} = {}
let min_support = 30;
let pass = 1;
let count = 0;
fs.writeFileSync(`synergies.csv`, `Champ1,Champ2,Champ3,Champ4,Champ5,Games,Wins\n`, {flag: "w+"})

do{
    frequent = {}
    for(let comp of game_data){
        let champs: string[] = []
        for(let role in comp.champs){
            champs.push(comp.champs[role])
        }
        let combs = combinations(champs, pass, []) as string[][]
        for(let comb of combs){
            let key = comb.sort().join(',')
            if(!frequent[key]) frequent[key] = [0, 0]  
            frequent[key][0]++
            if(comp.win){
                frequent[key][1]++
            }
        }
    }
    // console.log(frequent)
    let maxKey, maxValue = 0;
    count = 0;
    for(const [key, value] of Object.entries(frequent)) {
      if(value[0] > maxValue) {
        maxValue = value[0];
        maxKey = key;
      }

      if(value[0] < min_support){
        delete frequent[key]
      }else{
        count++
      }
    }
    console.log(`${maxKey}: ${maxValue}`)
    if(pass == 1){
        pass++
        continue
    }  
    for(const [key, value] of Object.entries(frequent)){
        let champs = key
        for (let index = 0; index < 5 - pass + 1; index++) {
            champs += ','
            
        }
        fs.writeFileSync(`synergies.csv`, `${champs}${value[0]},${value[1]}\n`, {flag: "a+"})
    }
    pass++
    
}while(count > 0 && pass <= 5)

