import axios from 'axios'
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import {sortW, cleanW, rankedSortW, rankedCleanW} from './sort-clean';
const ranks = [
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "DIAMOND"
]

const subranks = [
    "I",
    "II",
    "III",
    "IV"
]

export default async function getRanked(arg: string, opt: Array<string>){
    const riotToken = fs.readFileSync(opt['token'],'utf8');
    const inst = rateLimit(rateLimit(axios.create(), {maxRPS: 15}), {maxRequests: 90, perMilliseconds:120000});
    inst.defaults.headers.common['X-Riot-Token'] = riotToken;

    let region: string = arg;
    let dir: string = opt['dir'];
    let patch: string = opt['patch'];

    switch (region) {
        case "EUW1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "EUN1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "RU":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "TR1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "ME1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;

        case "OC1":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "SG2":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "TW2":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "VN2":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break

        case "NA1":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "BR1":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA1":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA2":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break

        case "KR":
            inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break
        case "JP1":
            inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break

        default:
            console.log("region not recognised");
            return;
    }

    if(!fs.existsSync(`${dir}/${patch}`)){
        fs.mkdirSync(`${dir}/${patch}`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}`)){
        fs.mkdirSync(`${dir}/${patch}/${region}`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}/games`)){
        fs.mkdirSync(`${dir}/${patch}/${region}/games`)
    }

   try{
    if(!fs.existsSync(`${dir}/${patch}/${region}/MASTER_page.json`)){
        console.log("Gathering Master data")
        fs.writeFileSync(`${dir}/${patch}/${region}/MASTER_page.json`, "{\"last_page\": 1}")
        let mastersResponse = await inst.get(`https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5`)
        console.log("got players")
        for(let master of mastersResponse.data["entries"]){
            let gamesResponse = await inst.get(`/lol/match/v5/matches/by-puuid/${master['puuid']}/ids?queue=420&start=0&count=5`)
            let games = gamesResponse.data
            for(let game of games){
                if(fs.existsSync(`${dir}/${patch}/${region}/games/overview_${game}.json`)){
                    console.log("Dupe game found!")
                    continue
                }
                console.log(`collecting ${game}`)
                let gameResponse = await inst.get(`/lol/match/v5/matches/${game}`)
                rankedSortW((await rankedCleanW(gameResponse.data, region, inst)), region, `${dir}/${patch}/${region}/games`)
            }
        }
    }
   }catch(error){
        if(!error.response){
            console.error(error)
            return;
        }
        if(error.response.status == 400){
            console.log("get a new key");
            return;
        }
        if(error.response.status == 429){
            console.log("overloaded the api this messed up the flow please restart")
            return;
        }
        console.error(error.response.data)
        return
    }

    try{
        if(!fs.existsSync(`${dir}/${patch}/${region}/GRANDMASTER_page.json`)){
            console.log("Gathering Grandmaster data")
            fs.writeFileSync(`${dir}/${patch}/${region}/GRANDMASTER_page.json`, "{\"last_page\": 1}")
            let grandmastersResponse = await inst.get(`https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5`)
            for(let grandmaster of grandmastersResponse.data["entries"]){
                let gamesResponse = await inst.get(`/lol/match/v5/matches/by-puuid/${grandmaster['puuid']}/ids?queue=420&start=0&count=5`)
                for(let game of gamesResponse.data){
                    if(fs.existsSync(`${dir}/${patch}/${region}/games/overview_${game}.json`)){
                        console.log("Dupe game found!")
                        continue
                    }
                    console.log(`collecting ${game}`)
                    let gameResponse = await inst.get(`/lol/match/v5/matches/${game}`)
                    rankedSortW((await rankedCleanW(gameResponse.data, region, inst)), region, `${dir}/${patch}/${region}/games`)
                }
            }
        }
    
    }catch(error){
        if(!error.response){
            console.error(error)
            return;
        }
        if(error.response.status == 400){
            console.log("get a new key");
            return;
        }
        if(error.response.status == 429){
            console.log("overloaded the api this messed up the flow please restart")
            return;
        }
        console.error(error.response.data)
    }

    for(let rank of ranks){
        for(let subrank of subranks){
            if (!fs.existsSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`))
            fs.writeFileSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`, "{\"last_page\": 1}")
        }
    }

    while(true){
        try{
            for(let rank of ranks){
                for(let subrank of subranks){
                    let metadata = JSON.parse(fs.readFileSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`, { encoding: 'utf8', flag: 'r' }))
                    let playerResponse = await inst.get(`https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${rank}/${subrank}?page=${metadata.last_page}`)
                    for(let player of playerResponse.data){
                        let gamesResponse = await inst.get(`/lol/match/v5/matches/by-puuid/${player['puuid']}/ids?queue=420&start=0&count=5`)
                        for(let game of gamesResponse.data){
                            if(fs.existsSync(`${dir}/${patch}/${region}/games/overview_${game}.json`)){
                                console.log("Dupe game found!")
                                continue
                            }
                            console.log(`collecting ${game}`)
                            let gameResponse = await inst.get(`/lol/match/v5/matches/${game}`)
                            rankedSortW((await rankedCleanW(gameResponse.data, region, inst)), region, `${dir}/${patch}/${region}/games`)
                        }
                    }
                    metadata.last_page++
                    fs.writeFileSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`, JSON.stringify(metadata))
                }
            }
        }catch(error){
            if(!error.response){
                console.error(error)
                return;
            }
            if(error.response.status == 400){
                console.log("get a new key");
                return;
            }
            if(error.response.status == 429){
                console.log("overloaded the api restarting page")
                continue;
            }

            console.error(error.response.data)
        }
    }
    console.log(`Done!`)
}