export async function onRequest(context) {
    const responseMsg = function (msg) {
        return new Response(JSON.stringify({
            code: 500,
            success: false,
            message: msg
        }), {
            headers: { "Content-Type": "application/json" }
        })
    }
    const request = context.request;
    try {
        const formData = await request.formData();
        const width = formData.get("width");
        const height = formData.get("height");
        const sign = formData.get("sign");
        const t = formData.get("t");
        const token = formData.get("token");

        const agent = [
            'Mozilla/5.0 (Linux; Android 7.1.1; OD103 Build/NMF26F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/4G Language/zh_CN',
            'Mozilla/5.0 (Linux; Android 7.1.1; MI 6 Build/NMF26X; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/4G Language/zh_CN',
            'Mozilla/5.0 (Linux; Android 8.0.0; MI 8 Build/OPR1.170623.027; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/4G Language/zh_CN',
            'Mozilla/5.0 (Linux; Android 7.1.1; MI 6 Build/NMF26X; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/4G Language/zh_CN',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_1_1 like Mac OS X) AppleWebKit/604.3.5 (KHTML, like Gecko) Mobile/15B150 MicroMessenger/6.6.1 NetType/WIFI Language/zh_CN',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Mobile/14E304 MicroMessenger/6.5.7 NetType/WIFI Language/zh_CN',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13G36 MicroMessenger/6.5.7 NetType/WIFI Language/zh_CN',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E302 MicroMessenger/6.5.7 NetType/WIFI Language/zh_CN',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15G77 MicroMessenger/6.5.7 NetType/WIFI Language/zh_CN'
        ];
        const url = `https://go.heytea.com/api/service-cps/user/diy?sign=${sign}&t=${t}`;
        const headers = {
            'Authorization': token,
            'User-Agent': agent[Math.floor(Math.random() * agent.length)],
            'Referer': 'https://servicewechat.com/wx696a42df4f2456d3/1246/page-frame.html',
        };
        const file = formData.get("file");
        if (!file || !sign || !t || !token) {
            return responseMsg('处理失败，请尝试刷新页面或更换浏览器');
        }
        // 构造 FormData
        const form = new FormData();
        form.append('file', file, `${t}.png`);
        form.append('width', width);
        form.append('height', height);
        // 发送请求
        const getResponse = await fetch(url, {
            method: "POST",
            headers: headers,
            body: form,
            signal: AbortSignal.timeout(60000)
        });
        if (!getResponse.ok) {
            return responseMsg(`请求失败: ${getResponse.status}`);
        }
        const getData = await getResponse.json();
        return new Response(JSON.stringify(getData), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return responseMsg(`请求出错: ${err.message}`);
    }
}
