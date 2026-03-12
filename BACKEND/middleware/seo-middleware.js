const fs = require('fs');
const path = require('path');

module.exports = (pool) => {
    return async (req, res, next) => {
        if (!req.accepts('html') || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        try {
            const [configs] = await pool.execute(
                `SELECT config_key, config_value FROM config 
                 WHERE config_key LIKE 'seo_%' 
                 OR config_key IN ('site_name', 'site_title', 'site_description', 'site_keywords', 'site_logo')`
            );
            const seoData = {};
            configs.forEach(config => {
                seoData[config.config_key] = config.config_value;
            });
            const indexPath = path.join(__dirname, '../../FRONTEND/dist/index.html');
            if (!fs.existsSync(indexPath)) {
                console.error('index.html not found at:', indexPath);
                return next();
            }
            let html = fs.readFileSync(indexPath, 'utf8');
            const metaTags = generateMetaTags(seoData);
            html = html.replace('<head>', '<head>\n' + metaTags);
            res.send(html);
        } catch (error) {
            console.error('SEO middleware error:', error);
            return next();
        }
    };
};

function generateMetaTags(seo) {
    let tags = '';
    tags += `  <title>${escapeHtml(seo.seo_title || seo.site_title || 'MAKE ME TREND')}</title>\n`;
    tags += `  <meta name="description" content="${escapeHtml(seo.seo_description || seo.site_description || '')}">\n`;
    tags += `  <meta name="keywords" content="${escapeHtml(seo.seo_keywords || seo.site_keywords || '')}">\n`;
    tags += `  <meta name="author" content="${escapeHtml(seo.seo_meta_author || 'MAKE ME TREND')}">\n`;
    if (seo.seo_meta_revisit_after) tags += `  <meta name="revisit-after" content="${escapeHtml(seo.seo_meta_revisit_after)}">\n`;
    if (seo.seo_meta_rating) tags += `  <meta name="rating" content="${escapeHtml(seo.seo_meta_rating)}">\n`;
    if (seo.seo_meta_distribution) tags += `  <meta name="distribution" content="${escapeHtml(seo.seo_meta_distribution)}">\n`;
    if (seo.seo_meta_coverage) tags += `  <meta name="coverage" content="${escapeHtml(seo.seo_meta_coverage)}">\n`;
    if (seo.seo_meta_category) tags += `  <meta name="category" content="${escapeHtml(seo.seo_meta_category)}">\n`;
    if (seo.seo_canonical_url) tags += `  <link rel="canonical" href="${escapeHtml(seo.seo_canonical_url)}">\n`;
    tags += `  <meta property="og:title" content="${escapeHtml(seo.seo_og_title || seo.seo_title || seo.site_title || '')}">\n`;
    tags += `  <meta property="og:description" content="${escapeHtml(seo.seo_og_description || seo.seo_description || seo.site_description || '')}">\n`;
    tags += `  <meta property="og:type" content="website">\n`;
    tags += `  <meta property="og:url" content="${escapeHtml(seo.seo_canonical_url || '')}">\n`;
    if (seo.seo_og_image) tags += `  <meta property="og:image" content="${escapeHtml(seo.seo_og_image)}">\n`;
    tags += `  <meta property="og:site_name" content="${escapeHtml(seo.site_name || 'MAKE ME TREND')}">\n`;
    tags += `  <meta name="twitter:card" content="summary_large_image">\n`;
    tags += `  <meta name="twitter:title" content="${escapeHtml(seo.seo_twitter_title || seo.seo_og_title || seo.seo_title || seo.site_title || '')}">\n`;
    tags += `  <meta name="twitter:description" content="${escapeHtml(seo.seo_twitter_description || seo.seo_og_description || seo.seo_description || seo.site_description || '')}">\n`;
    if (seo.seo_twitter_image) tags += `  <meta name="twitter:image" content="${escapeHtml(seo.seo_twitter_image)}">\n`;
    else if (seo.seo_og_image) tags += `  <meta name="twitter:image" content="${escapeHtml(seo.seo_og_image)}">\n`;
    if (seo.seo_hreflang_en) tags += `  <link rel="alternate" hreflang="en" href="${escapeHtml(seo.seo_hreflang_en)}">\n`;
    if (seo.seo_hreflang_si) tags += `  <link rel="alternate" hreflang="si" href="${escapeHtml(seo.seo_hreflang_si)}">\n`;
    if (seo.seo_hreflang_ta) tags += `  <link rel="alternate" hreflang="ta" href="${escapeHtml(seo.seo_hreflang_ta)}">\n`;
    if (seo.seo_google_verification) tags += `  <meta name="google-site-verification" content="${escapeHtml(seo.seo_google_verification)}">\n`;
    if (seo.seo_bing_verification) tags += `  <meta name="msvalidate.01" content="${escapeHtml(seo.seo_bing_verification)}">\n`;
    if (seo.seo_yandex_verification) tags += `  <meta name="yandex-verification" content="${escapeHtml(seo.seo_yandex_verification)}">\n`;
    if (seo.seo_pinterest_verification) tags += `  <meta name="p:domain_verify" content="${escapeHtml(seo.seo_pinterest_verification)}">\n`;
    if (seo.seo_structured_data) tags += `  <script type="application/ld+json">\n${seo.seo_structured_data}\n  </script>\n`;
    return tags;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
