const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 8000);
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || '1mb';
const payloadsDir = path.join(__dirname, 'payloads');

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: MAX_BODY_SIZE }));

const safeUrl = (input) => {
    try {
        const parsed = new URL(input);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
        return parsed.toString();
    } catch {
        return null;
    }
};

const inferWafSignals = (response) => {
    const headers = response.headers || {};
    const body = typeof response.data === 'string' ? response.data.toLowerCase() : JSON.stringify(response.data || {}).toLowerCase();
    const signals = [];

    if (headers.server && /cloudflare|akamai|imperva|sucuri|awswaf|f5/i.test(headers.server)) signals.push('WAF_BRAND_HEADER');
    if (headers['x-cache'] || headers['cf-ray'] || headers['x-sucuri-id']) signals.push('EDGE_INTERMEDIARY');
    if (/access denied|forbidden|blocked|request rejected|malicious/i.test(body)) signals.push('BLOCK_PAGE_BODY');
    if ([403, 406, 429].includes(response.status)) signals.push('ENFORCEMENT_STATUS');
    return signals;
};

const fingerprintResponse = (response) => {
    const contentType = response.headers?.['content-type'] || 'unknown';
    const location = response.headers?.location ? 'redir' : 'noredir';
    return `${response.status}:${contentType.split(';')[0]}:${location}`;
};

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'wafflex-backend', port: PORT });
});

app.post('/api/check-ip', async (req, res) => {
    try {
        const { proxyUrl } = req.body;
        const axiosConfig = { url: 'http://ip-api.com/json/', method: 'GET', timeout: 5000 };
        if (proxyUrl) {
            const isHttps = proxyUrl.startsWith('https');
            const agent = isHttps ? new HttpsProxyAgent(proxyUrl) : new HttpProxyAgent(proxyUrl);
            if (isHttps) axiosConfig.httpsAgent = agent;
            else axiosConfig.httpAgent = agent;
            axiosConfig.proxy = false;
        }
        const response = await axios(axiosConfig);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching IP information:', error.message);
        res.status(500).json({ status: 'fail', message: 'Failed to fetch IP information', error: error.message });
    }
});

app.post('/api/proxy', async (req, res) => {
    const startTime = Date.now();
    try {
        const { targetUrl, method, headers, cookies, payload } = req.body;
        const normalizedUrl = safeUrl(targetUrl);
        if (!normalizedUrl) return res.status(400).json({ error: 'A valid http/https targetUrl is required' });

        const axiosConfig = {
            url: normalizedUrl,
            method: method || 'GET',
            headers: { ...headers },
            validateStatus: () => true,
            timeout: REQUEST_TIMEOUT_MS,
            maxRedirects: 0,
        };

        if (cookies) axiosConfig.headers.Cookie = cookies;
        if (method && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) axiosConfig.data = payload;

        const response = await axios(axiosConfig);
        const latency = Date.now() - startTime;
        const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {});
        const responseLength = responseText.length;
        const wafSignals = inferWafSignals(response);
        const fingerprint = fingerprintResponse(response);

        res.json({
            status: response.status,
            latency,
            data: response.data,
            headers: response.headers,
            responseLength,
            wafSignals,
            fingerprint,
        });
    } catch (error) {
        const latency = Date.now() - startTime;
        console.error(`Relay error to ${req.body.targetUrl}:`, error.message);
        res.status(500).json({
            status: 500,
            latency,
            error: error.message,
            isHardError: true,
            responseLength: 0,
            wafSignals: ['TRANSPORT_ERROR'],
            fingerprint: 'transport_error',
        });
    }
});

app.get('/api/payloads', (req, res) => {
    fs.readdir(payloadsDir, (err, files) => {
        if (err) {
            console.error('Error reading payload directory:', err);
            return res.json(['sqli.txt', 'xss.txt', 'lfi.txt', 'rce.txt', 'threshold.txt']);
        }
        res.json(files.filter((f) => f.endsWith('.txt')));
    });
});

app.get('/api/payloads/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filepath = path.join(payloadsDir, safeFilename);
    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading ${safeFilename}:`, err);
            return res.status(404).json({ error: 'File not found' });
        }
        res.send(data);
    });
});

app.put('/api/payloads/:filename', (req, res) => {
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ error: 'Content is required' });
    const safeFilename = path.basename(req.params.filename);
    const filepath = path.join(payloadsDir, safeFilename);
    fs.writeFile(filepath, content, 'utf8', (err) => {
        if (err) {
            console.error(`Error writing to ${safeFilename}:`, err);
            return res.status(500).json({ error: 'Failed to write file' });
        }
        res.json({ success: true, message: 'File saved' });
    });
});

app.listen(PORT, () => {
    console.log(`WaffleX backend listening on port ${PORT}`);
});
