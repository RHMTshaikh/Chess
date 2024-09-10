export default function makeGetPublicGames ({ listPublicGames }: any) {
    return async function getPublicGames ({httpRequest}:any) {
        
        const publicGames = await listPublicGames({ limit:20 });
        return {
            headers :{
                'Content-Type': 'application/json'
            },
            statusCode: 200,
            body: publicGames
        }
    }
}
