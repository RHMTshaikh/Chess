export default function makeAuthorizUser({ authorization }: { authorization: any }) {
    return async function authorizUser(httpRequest: any): Promise<{ email: string }> {
        const token = httpRequest.cookies.accessToken;
        const email = await authorization({ token });
        return { email };
    };
}
