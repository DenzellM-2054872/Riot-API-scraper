import fs from 'fs';
import queues from './queues.json'
import pako from 'pako'
import { RateLimitedAxiosInstance } from 'axios-rate-limit';
    // let zip = pako.deflate(clean(`test.json`))
    // fs.writeFileSync('test-zip.gz', zip,  {encoding: 'utf8', flag: 'w'})
    // let test = fs.readFileSync('test-zip.gz')
    // console.log(pako.inflate(test, { to: 'string' }))
    function clean(filePath: string){
        // console.log(filePath)
        let file = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }))
        delete file.metadata.dataVersion
    
        delete file.info.gameId
        delete file.info.gameName
    
        for (let participant of file.info.participants){
            for (let i = 0; i < 12; i++) {
                delete participant[`PlayerScore${i}`]
            }
            for (let i = 1; i <= 6; i++) {
                delete participant[`playerAugment${i}`]
            }
            for(let challenge in participant.challenges){
                if(participant.challenges[challenge] == 0)
                delete participant.challenges[challenge]
            }
    
            delete participant.eligibleForProgression
    
            file.info.gameEndedInEarlySurrender = participant.gameEndedInEarlySurrender
            file.info.gameEndedInSurrender = participant.gameEndedInSurrender
            delete participant.gameEndedInEarlySurrender
            delete participant.gameEndedInSurrender
            delete participant.missions
            delete participant.teamEarlySurrendered
    
        }
    
        fs.writeFileSync(filePath, JSON.stringify(file),  {encoding: 'utf8', flag: 'w'})
    }
    export function sortW(data: any, fileName: string, filePath: string){

        let queue: string = queues[data.info.queueId].description
    
        if(!fs.existsSync(`${filePath}/${queue}`)){
            fs.mkdirSync(`${filePath}/${queue}`)
        }
        fs.writeFileSync( `${filePath}/${queue}/${fileName}`, JSON.stringify(data))
    }
    export function cleanW(data: any){
        delete data.metadata.dataVersion

        delete data.info.gameId
        delete data.info.gameName

        for (let participant of data.info.participants){
            for (let i = 0; i < 12; i++) {
                delete participant[`PlayerScore${i}`]
            }
            for (let i = 1; i <= 6; i++) {
                delete participant[`playerAugment${i}`]
            }
            for(let challenge in participant.challenges){
                if(participant.challenges[challenge] == 0)
                delete participant.challenges[challenge]
            }

            delete participant.eligibleForProgression

            data.info.gameEndedInEarlySurrender = participant.gameEndedInEarlySurrender
            data.info.gameEndedInSurrender = participant.gameEndedInSurrender
            delete participant.gameEndedInEarlySurrender
            delete participant.gameEndedInSurrender
            delete participant.missions
            delete participant.teamEarlySurrendered
        }

        return data;
    }

    export function rankedSortW(data: any, region: string, filePath: string){
        fs.writeFileSync(`${filePath}/overview_${region}_${data['info']['gameId']}.json`, JSON.stringify(data))
    }

    export async function rankedCleanW(data: any, region: string, inst: RateLimitedAxiosInstance){
        delete data.metadata.dataVersion

        delete data.info.gameName

        for (let participant of data.info.participants){
            for (let i = 0; i < 12; i++) {
                delete participant[`PlayerScore${i}`]
            }
            for (let i = 1; i <= 6; i++) {
                delete participant[`playerAugment${i}`]
            }
            for(let challenge in participant.challenges){
                if(participant.challenges[challenge] == 0)
                delete participant.challenges[challenge]
            }

            let rankResponse = await inst.get(`/lol/league/v4/entries/by-puuid/${participant.puuid}`)
            let Solo5v5 : (undefined | any) = undefined 
            for(let rank of rankResponse.data){
                if(rank.queueType == "RANKED_SOLO_5x5")
                    Solo5v5 = rank
            }

            if(Solo5v5){
                participant.tier = Solo5v5.tier
                participant.rank = Solo5v5.rank
            }


            
            let masteryResponse = await inst.get(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${participant.puuid}/by-champion/${participant.championId}`)
            participant.championMastery = masteryResponse.data.championPoints
            delete participant.eligibleForProgression

            data.info.gameEndedInEarlySurrender = participant.gameEndedInEarlySurrender
            data.info.gameEndedInSurrender = participant.gameEndedInSurrender
            delete participant.gameEndedInEarlySurrender
            delete participant.gameEndedInSurrender
            delete participant.missions
            delete participant.teamEarlySurrendered
        }

        return data;
    }


function sort(filePath: string, fileName: string){
    let file = JSON.parse(fs.readFileSync(`${filePath}/${fileName}`, { encoding: 'utf8', flag: 'r' }))
    let queue: string = queues[file.info.queueId].description

    if(!fs.existsSync(`${filePath}/${queue}`)){
        fs.mkdirSync(`${filePath}/${queue}`)
    }
    fs.renameSync(`${filePath}/${fileName}`, `${filePath}/${queue}/${fileName}`)
    // console.log()
}

export default function sortClean(arg: string, opt: Array<string>){
    const dir: string = arg;
    let versions = fs.readdirSync(`${dir}/`);

    for (let version of versions){
        let regions = fs.readdirSync(`${dir}/${version}`); 

        for (let region of regions){
            const basePath = `${dir}/${version}/${region}`
            let content = fs.readdirSync(`${basePath}`, { withFileTypes: true })
            const files = content.filter(dirent => dirent.isFile()).map(dirent => dirent.name);
            for (let file of files){
                clean(`${basePath}/${file}`)
                sort(`${basePath}`, `${file}`)
            }
        }
    }
}