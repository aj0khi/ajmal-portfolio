<?php
declare(strict_types=1);

const MAX_RESPONSE_BYTES = 8_000_000;

$target = filter_input(INPUT_GET, 'url', FILTER_VALIDATE_URL);
if (!$target || !preg_match('/^https?:\/\//i', $target)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    exit('A valid http(s) URL is required.');
}

$parts = parse_url($target);
$host = strtolower($parts['host'] ?? '');
$resolvedIp = gethostbyname($host);
$blockedIp = filter_var($resolvedIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
if ($host === '' || $blockedIp) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Private and local destinations are not available through this proxy.');
}

$curl = curl_init($target);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_USERAGENT => 'AjmalOS Browser/1.0',
    CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml']
]);
$body = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$contentType = (string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
curl_close($curl);

if (!is_string($body) || $status >= 400 || strlen($body) > MAX_RESPONSE_BYTES || !str_contains($contentType, 'text/html')) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    exit('This destination could not be rendered inside AjmalOS. Use OPEN EXTERNALLY.');
}

$safeBase = htmlspecialchars($target, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$body = preg_replace('/<head(\s[^>]*)?>/i', '$0<base href="' . $safeBase . '">', $body, 1) ?? $body;
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Content-Security-Policy: frame-ancestors \'self\'');
echo $body;