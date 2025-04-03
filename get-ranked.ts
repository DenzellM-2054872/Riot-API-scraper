import axios from 'axios'
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import {sortW, cleanW, rankedSortW, rankedCleanW} from './sort-clean';
import moment from 'moment';

let yesterday: number = moment().subtract(24, 'hours').unix()

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
    const major_inst = rateLimit(rateLimit(axios.create(), {maxRPS: 15}), {maxRequests: 90, perMilliseconds:120000});
    const minor_inst = rateLimit(rateLimit(axios.create(), {maxRPS: 15}), {maxRequests: 90, perMilliseconds:120000});

    major_inst.defaults.headers.common['X-Riot-Token'] = riotToken;
    minor_inst.defaults.headers.common['X-Riot-Token'] = riotToken;
    

    let region: string = arg;
    let dir: string = opt['dir'];
    let patch: string = opt['patch'];

    switch (region) {
        case "EUW1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "EUN1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "RU":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "TR1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "ME1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;

        case "OC1":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "SG2":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "TW2":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "VN2":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break

        case "NA1":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "BR1":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA1":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA2":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break

        case "KR":
            major_inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break
        case "JP1":
            major_inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break

        default:
            console.log("region not recognised");
            return;
    }
    minor_inst.defaults.baseURL = `https://${region.toLowerCase()}.api.riotgames.com`;

    if(!fs.existsSync(`${dir}/${patch}`)){
        fs.mkdirSync(`${dir}/${patch}`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}`)){
        fs.mkdirSync(`${dir}/${patch}/${region}`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}/games`)){
        fs.mkdirSync(`${dir}/${patch}/${region}/games`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}/MASTER_page.json`) || JSON.parse(fs.readFileSync(`${dir}/${patch}/${region}/MASTER_page.json`, { encoding: 'utf8', flag: 'r' }))['last_page'] != -1){
            while(true){
            try{
            console.log("Gathering Master data")
            fs.writeFileSync(`${dir}/${patch}/${region}/MASTER_page.json`, "{\"last_page\": 1}")
            let mastersResponse = await minor_inst.get(`/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5`)
            console.log("got players")
            for(let master of mastersResponse.data["entries"]){
                let gamesResponse = await major_inst.get(`/lol/match/v5/matches/by-puuid/${master['puuid']}/ids?startTime=${yesterday}&queue=420&start=0&count=5`)
                let games = gamesResponse.data
                for(let game of games){
                    if(fs.existsSync(`${dir}/${patch}/${region}/games/overview_${game}.json`)){
                        console.log("Dupe game found!")
                        continue
                    }
                    console.log(`collecting ${game}`)
                    let gameResponse = await major_inst.get(`/lol/match/v5/matches/${game}`)
                    if(!(gameResponse.data.info.gameVersion as string).startsWith('15.7')) continue;
                    rankedSortW((await rankedCleanW(gameResponse.data, region, minor_inst)), region, `${dir}/${patch}/${region}/games`)
                }
                yesterday = moment().subtract(24, 'hours').unix()
            }
            fs.writeFileSync(`${dir}/${patch}/${region}/MASTER_page.json`, "{\"last_page\": -1}")
            break
            }

            catch(error){
                if(!error.response){
                    console.error(error)
                    return;
                }
                if(error.response.status == 400){
                    console.error(error.response.data)
                    console.log("get a new key");
                    return;
                }
                if(error.response.status == 404){
                    console.error(error.response.data)
                    continue;
                }
                if(error.response.status == 429){
                    console.log("overloaded the api restarting rank")
                    continue;
                }
                if(error.response.status == 504){
                    console.log("idk what this one is")
                    await new Promise(f => setTimeout(f, 1000))
                    continue;
                }
                console.error(error.response.status)
            }
        }
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}/GRANDMASTER_page.json`) || JSON.parse(fs.readFileSync(`${dir}/${patch}/${region}/GRANDMASTER_page.json`, { encoding: 'utf8', flag: 'r' }))['last_page'] != -1){
        while(true){
            try{
                console.log("Gathering Grandmaster data")
                fs.writeFileSync(`${dir}/${patch}/${region}/GRANDMASTER_page.json`, "{\"last_page\": 1}")
                let grandmastersResponse = await minor_inst.get(`/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5`)
                for(let grandmaster of grandmastersResponse.data["entries"]){
                    let gamesResponse = await major_inst.get(`/lol/match/v5/matches/by-puuid/${grandmaster['puuid']}/ids?startTime=${yesterday}&queue=420&start=0&count=5`)
                    for(let game of gamesResponse.data){
                        if(fs.existsSync(`${dir}/${patch}/${region}/games/overview_${game}.json`)){
                            console.log("Dupe game found!")
                            continue
                        }
                        console.log(`collecting ${game}`)
                        let gameResponse = await major_inst.get(`/lol/match/v5/matches/${game}`)
                        if(!(gameResponse.data.info.gameVersion as string).startsWith('15.7')) continue;
                        rankedSortW((await rankedCleanW(gameResponse.data, region, minor_inst)), region, `${dir}/${patch}/${region}/games`)
                    }
                    yesterday = moment().subtract(24, 'hours').unix()
                }
                fs.writeFileSync(`${dir}/${patch}/${region}/MASTER_page.json`, "{\"last_page\": -1}")
                break

            }catch(error){
                if(!error.response){
                    console.error(error)
                    return;
                }
                if(error.response.status == 400){
                    console.error(error.response.data)
                    console.log("get a new key");
                    return;
                }
                if(error.response.status == 404){
                    console.error(error.response.data)
                    continue;
                }
                if(error.response.status == 429){
                    console.log("overloaded the api restarting rank")
                    continue;
                }
                if(error.response.status == 504){
                    console.log("idk what this one is")
                    await new Promise(f => setTimeout(f, 1000))
                    continue;
                }
                console.error(error.response.data)
            }
        }
    }
    console.log('done with apex ranks')
    let pages = {}
    for(let rank of ranks){
        for(let subrank of subranks){
            if (!fs.existsSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`)){
                fs.writeFileSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`, "{\"last_page\": 1}")
                pages[`${rank}${subrank}`] = 1
            }else{
                pages[`${rank}${subrank}`] = JSON.parse(fs.readFileSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`, { encoding: 'utf8', flag: 'r' }))['last_page']
            }
        }
    }

    let min_page = Infinity
    for(let rank in pages){
        if(min_page > pages[rank]) min_page = pages[rank]
    }
    let lastPlayer: string | undefined = undefined
    let recovery: boolean = false
    let itt = 0;
    while(true){
        try{
        for(let rank of ranks){
            for(let subrank of subranks){
                if(pages[`${rank}${subrank}`] > min_page){
                    console.log(`skipping ${rank} ${subrank} page ${pages[`${rank}${subrank}`]}`)
                    continue;
                }
                try{
                    let playerResponse = await minor_inst.get(`/lol/league/v4/entries/RANKED_SOLO_5x5/${rank}/${subrank}?page=${pages[`${rank}${subrank}`]}`)
                    console.log(`${playerResponse.data.length} players found!`)
                    for(itt; itt <  playerResponse.data.length; ++itt){
                        let gamesResponse = await major_inst.get(`/lol/match/v5/matches/by-puuid/${playerResponse.data[itt]['puuid']}/ids?startTime=${yesterday}&queue=420&start=0&count=5`)
                        if(gamesResponse.data.length == 0){
                            console.log(`No games were found [${itt}/${playerResponse.data.length}]`)
                            continue
                        } 
                        for(let game of gamesResponse.data){
                            if(fs.existsSync(`${dir}/${patch}/${region}/games/overview_${game}.json`)){
                                console.log('dupe game found')
                                continue
                            }
                            console.log(`collecting ${game}`)
                            let gameResponse = await major_inst.get(`/lol/match/v5/matches/${game}`)
                            if(!(gameResponse.data.info.gameVersion as string).startsWith('15.7')) continue;
                            rankedSortW((await rankedCleanW(gameResponse.data, region, minor_inst)), region, `${dir}/${patch}/${region}/games`)
                        }
                        yesterday = moment().subtract(24, 'hours').unix()
                        console.log(`Done with player [${itt}/${playerResponse.data.length}]`)
                    }
                    console.log(`finished ${rank} ${subrank} page ${pages[`${rank}${subrank}`]}`)
                    pages[`${rank}${subrank}`]++
                    fs.writeFileSync(`${dir}/${patch}/${region}/${rank}${subrank}_page.json`, `{\"last_page\": ${(pages[`${rank}${subrank}`])}}`)
                    itt = 0;
                    
                }catch(error){
                    if(!error.response){
                        console.error(error)
                        return;
                    }
                    if(error.response.status == 400){
                        console.error(error.response.data)
                        console.log("get a new key");
                        return;
                    }
                    if(error.response.status == 404){
                        console.error(error.response.data)
                        continue;
                    }
                    if(error.response.status == 429){
                        console.log("overloaded the api restarting page")
                        itt--
                        continue;
                    }
                    if(error.response.status == 504){
                        console.log("idk what this one is")
                        await new Promise(f => setTimeout(f, 1000))
                        itt--
                        continue;
                    }
                    console.error(error.response.data)
                }
            }
        }
        min_page++
        }catch(error){
            if(!error.response){
                console.error(error)
                return;
            }
            if(error.response.status == 400){
                console.error(error.response.data)
                console.log("get a new key");
                return;
            }
            if(error.response.status == 404){
                console.error(error.response.data)
                continue;
            }
            if(error.response.status == 429){
                console.log("overloaded the api restarting rank")
                continue;
            }
            if(error.response.status == 504){
                console.log("idk what this one is")
                await new Promise(f => setTimeout(f, 1000))
                continue;
            }
            console.error(error.response.data)
        }
    }
    console.log(`Done!`)
}