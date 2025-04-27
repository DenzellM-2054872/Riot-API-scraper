import fs from 'fs';
import {keys} from './championFull.json'
import {data} from './championFull.json'
import type { ChampType } from './ChampionTypes'
let data_folder = "overview/15.4"

let game_data: object[] = []
let details = { dragonCount:{   0: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                1: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                2: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                3: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                4: {wins: 0, losses: 0, WR: 0, vs:{}}},

                grubCount:  {   0: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                1: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                2: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                3: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                4: {wins: 0, losses: 0, WR: 0, vs:{}},
                                5: {wins: 0, losses: 0, WR: 0, vs:{}},
                                6: {wins: 0, losses: 0, WR: 0, vs:{}}},

                atakhan:    {   0: {wins: 0, losses: 0, WR: 0, vs:{}},
                                1: {wins: 0, losses: 0, WR: 0, vs:{}}},

                herald:     {   0: {wins: 0, losses: 0, WR: 0, vs:{}},
                                1: {wins: 0, losses: 0, WR: 0, vs:{}}},

                inhibCount: {},
                towerCount: {},
                baron:      {},

                firstBlood: {wins: 0, losses: 0, WR: 0},
                firstDragon:{wins: 0, losses: 0, WR: 0},
                firstinhib: {wins: 0, losses: 0, WR: 0},
                firsttower: {wins: 0, losses: 0, WR: 0},
                firstbaron: {wins: 0, losses: 0, WR: 0},
                feats:      {   0: {wins: 0, losses: 0, WR: 0, vs:{}}, 
                                1: {wins: 0, losses: 0, WR: 0, vs:{}},
                            },
                soul:       {wins: 0, losses: 0, WR: 0},
                totalGames: 0
                }
let content = fs.readdirSync(data_folder, { withFileTypes: true })

interface KeysType{
    [ID: number]: string
}

interface DataType{
    [champID: string]: ChampType
}

function calcWR(stats: any){
    stats.WR = stats.wins / (stats.wins + stats.losses)
}
function getFeats(team: Object){
    let featCount = 0
    if(team['feats']['EPIC_MONSTER_KILL']['featState'] == 3){

        featCount++
    }
    if(team['feats']['FIRST_BLOOD']['featState'] == 3){

        featCount++
    }
    if(team['feats']['FIRST_TURRET']['featState'] == 1){

        featCount++
    }

    return (featCount >= 2)
}

const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

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
            details.totalGames++
            let team1 = game['info']['teams'][0]
            let team2 = game['info']['teams'][1]
            for(let team of game['info']['teams']){
                let opponent = team1
                if(team == team1)opponent = team2

                let teamFeats = getFeats(team) ? 1 : 0
                let opponentFeats = getFeats(opponent) ? 1 : 0
                if(!details.feats[teamFeats].vs[opponentFeats]) details.feats[teamFeats].vs[opponentFeats] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.feats[teamFeats].wins++
                    details.feats[teamFeats].vs[opponentFeats].wins++
                } 
                else{
                    details.feats[teamFeats].losses++
                    details.feats[teamFeats].vs[opponentFeats].losses++
                }
                calcWR(details.feats[teamFeats])
                calcWR(details.feats[teamFeats].vs[opponentFeats])

                let teamAtakhan = team['objectives']['atakhan']['kills']
                let opponentAtakhan = opponent['objectives']['atakhan']['kills']
                if(!details.atakhan[teamAtakhan].vs[opponentAtakhan]) details.atakhan[teamAtakhan].vs[opponentAtakhan] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.atakhan[teamAtakhan].wins++
                    details.atakhan[teamAtakhan].vs[opponentAtakhan].wins++
                } 
                else{
                    details.atakhan[teamAtakhan].losses++
                    details.atakhan[teamAtakhan].vs[opponentAtakhan].losses++
                }
                calcWR(details.atakhan[teamAtakhan])
                calcWR(details.atakhan[teamAtakhan].vs[opponentAtakhan])


                let teamBaron = team['objectives']['baron']['kills']
                let opponentBaron = opponent['objectives']['baron']['kills']
                if(!details.baron[teamBaron]) details.baron[teamBaron] = {wins: 0, losses: 0, WR: 0, vs:{}}
                if(!details.baron[teamBaron].vs[opponentBaron]) details.baron[teamBaron].vs[opponentBaron] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.baron[teamBaron].wins++
                    details.baron[teamBaron].vs[opponentBaron].wins++
                } 
                else{
                    details.baron[teamBaron].losses++
                    details.baron[teamBaron].vs[opponentBaron].losses++
                }
                calcWR(details.baron[teamBaron])
                calcWR(details.baron[teamBaron].vs[opponentBaron])

                if(team['objectives']['champion']['first']){
                    if(team['win']) details.firstBlood.wins++
                    else details.firstBlood.losses++
                }
                calcWR(details.firstBlood)

                let teamDragon= team['objectives']['dragon']['kills']
                let opponentDragon = opponent['objectives']['dragon']['kills']
                if(!details.dragonCount[teamDragon]) details.dragonCount[teamDragon] = {wins: 0, losses: 0, WR: 0, vs:{}}
                if(!details.dragonCount[teamDragon].vs[opponentDragon]) details.dragonCount[teamDragon].vs[opponentDragon] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.dragonCount[teamDragon].wins++
                    details.dragonCount[teamDragon].vs[opponentDragon].wins++
                } 
                else{
                    details.dragonCount[teamDragon].losses++
                    details.dragonCount[teamDragon].vs[opponentDragon].losses++
                }
                calcWR(details.dragonCount[teamDragon])
                calcWR(details.dragonCount[teamDragon].vs[opponentDragon])
                if(teamDragon >= 4 && opponentDragon < 4){
                    if(team['win']) details.soul.wins++
                    else details.soul.losses++
                }
                calcWR(details.soul)
                if(team['objectives']['dragon']['first']){
                    if(team['win']) details.firstDragon.wins++
                    else details.firstDragon.losses++
                }
                calcWR(details.firstDragon)

                let teamInhib = team['objectives']['inhibitor']['kills']
                let opponentInhib = opponent['objectives']['inhibitor']['kills']
                if(!details.inhibCount[teamInhib]) details.inhibCount[teamInhib] = {wins: 0, losses: 0, WR: 0, vs:{}}
                if(!details.inhibCount[teamInhib].vs[opponentInhib]) details.inhibCount[teamInhib].vs[opponentInhib] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.inhibCount[teamInhib].wins++
                    details.inhibCount[teamInhib].vs[opponentInhib].wins++
                } 
                else{
                    details.inhibCount[teamInhib].losses++
                    details.inhibCount[teamInhib].vs[opponentInhib].losses++
                }
                calcWR(details.inhibCount[teamInhib])
                calcWR(details.inhibCount[teamInhib].vs[opponentInhib])
                if(team['objectives']['inhibitor']['first']){
                    if(team['win']) details.firstinhib.wins++
                    else details.firstinhib.losses++
                }
                calcWR(details.firstinhib)

                let teamHerald = team['objectives']['riftHerald']['kills']
                let opponentHerald = opponent['objectives']['riftHerald']['kills']
                if(!details.herald[teamHerald]) details.herald[teamHerald] = {wins: 0, losses: 0, WR: 0, vs:{}}
                if(!details.herald[teamHerald].vs[opponentHerald]) details.herald[teamHerald].vs[opponentHerald] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.herald[teamHerald].wins++
                    details.herald[teamHerald].vs[opponentHerald].wins++
                } 
                else{
                    details.herald[teamHerald].losses++
                    details.herald[teamHerald].vs[opponentHerald].losses++
                }
                calcWR(details.herald[teamHerald])
                calcWR(details.herald[teamHerald].vs[opponentHerald])   


                let teamGrubs = team['objectives']['horde']['kills']
                let opponentGrubs = opponent['objectives']['horde']['kills']
                if(!details.grubCount[teamGrubs]) details.grubCount[teamGrubs] = {wins: 0, losses: 0, WR: 0, vs:{}}
                if(!details.grubCount[teamGrubs].vs[opponentGrubs]) details.grubCount[teamGrubs].vs[opponentGrubs] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.grubCount[teamGrubs].wins++
                    details.grubCount[teamGrubs].vs[opponentGrubs].wins++
                } 
                else{
                    details.grubCount[teamGrubs].losses++
                    details.grubCount[teamGrubs].vs[opponentGrubs].losses++
                }
                calcWR(details.grubCount[teamGrubs])
                calcWR(details.grubCount[teamGrubs].vs[opponentGrubs])   

                let teamTowers = team['objectives']['tower']['kills']
                let opponentTowers = opponent['objectives']['tower']['kills']
                if(!details.towerCount[teamTowers]) details.towerCount[teamTowers] = {wins: 0, losses: 0, WR: 0, vs:{}}
                if(!details.towerCount[teamTowers].vs[opponentTowers]) details.towerCount[teamTowers].vs[opponentTowers] = {wins: 0, losses: 0, WR: 0}
                if(team['win']){
                    details.towerCount[teamTowers].wins++
                    details.towerCount[teamTowers].vs[opponentTowers].wins++
                } 
                else{
                    details.towerCount[teamTowers].losses++
                    details.towerCount[teamTowers].vs[opponentTowers].losses++
                }
                calcWR(details.towerCount[teamTowers])
                calcWR(details.towerCount[teamTowers].vs[opponentTowers]) 
                if(team['objectives']['tower']['first']){
                    if(team['win']) details.firsttower.wins++
                    else details.firsttower.losses++
                }
                calcWR(details.firsttower)
            }
        } 
    }
    console.log("Data processed")
}

console.log("All data read!")

fs.writeFileSync(`data/overview.json`, JSON.stringify(details), {flag: "w+"})
