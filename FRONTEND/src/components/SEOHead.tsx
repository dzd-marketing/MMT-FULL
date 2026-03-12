import { useEffect } from 'react';
import axios from 'axios';

interface SEOData {
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    seo_og_title?: string;
    seo_og_description?: string;
    seo_og_image?: string;
    seo_twitter_title?: string;
    seo_twitter_description?: string;
    seo_twitter_image?: string;
    seo_canonical_url?: string;
    seo_meta_author?: string;
    seo_google_verification?: string;
    seo_bing_verification?: string;
    seo_pinterest_verification?: string;
    site_name?: string;
    site_title?: string;
    site_description?: string;
    site_keywords?: string;
}

const SEOHead: React.FC = () => {
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchSEOData = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/config/seo-data`);
                
                if (response.data.success) {
                    const seo: SEOData = response.data.data;
                    updateMetaTags(seo);
                }
            } catch (error) {
                console.error('Error fetching SEO data:', error);
            }
        };

        fetchSEOData();
    }, []);

    const updateMetaTags = (seo: SEOData) => {
        // Update document title
        document.title = seo.seo_title || seo.site_title || 'MAKE ME TREND';

        // Helper function to update or create meta tags
        const setMetaTag = (name: string, content: string, attribute: string = 'name') => {
            if (!content) return;
            
            let element = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Basic meta tags
        setMetaTag('description', seo.seo_description || seo.site_description || '');
        setMetaTag('keywords', seo.seo_keywords || seo.site_keywords || '');
        setMetaTag('author', seo.seo_meta_author || 'MAKE ME TREND');

        // Canonical URL
        if (seo.seo_canonical_url) {
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', seo.seo_canonical_url);
        }

        // Open Graph tags
        setMetaTag('og:title', seo.seo_og_title || seo.seo_title || seo.site_title || '', 'property');
        setMetaTag('og:description', seo.seo_og_description || seo.seo_description || seo.site_description || '', 'property');
        setMetaTag('og:site_name', seo.site_name || 'MAKE ME TREND', 'property');
        setMetaTag('og:type', 'website', 'property');
        setMetaTag('og:url', seo.seo_canonical_url || window.location.href, 'property');
        
        if (seo.seo_og_image) {
            setMetaTag('og:image', seo.seo_og_image, 'property');
        }

        // Twitter Card tags
        setMetaTag('twitter:card', 'summary_large_image', 'name');
        setMetaTag('twitter:title', seo.seo_twitter_title || seo.seo_og_title || seo.seo_title || seo.site_title || '', 'name');
        setMetaTag('twitter:description', seo.seo_twitter_description || seo.seo_og_description || seo.seo_description || seo.site_description || '', 'name');
        
        if (seo.seo_twitter_image) {
            setMetaTag('twitter:image', seo.seo_twitter_image, 'name');
        } else if (seo.seo_og_image) {
            setMetaTag('twitter:image', seo.seo_og_image, 'name');
        }

        // Site verification
        if (seo.seo_google_verification) {
            setMetaTag('google-site-verification', seo.seo_google_verification);
        }
        if (seo.seo_bing_verification) {
            setMetaTag('msvalidate.01', seo.seo_bing_verification);
        }
        if (seo.seo_pinterest_verification) {
            setMetaTag('p:domain_verify', seo.seo_pinterest_verification);
        }

        // Add structured data
        if (seo.seo_structured_data) {
            let script = document.querySelector('script[type="application/ld+json"]');
            if (!script) {
                script = document.createElement('script');
                script.setAttribute('type', 'application/ld+json');
                document.head.appendChild(script);
            }
            script.textContent = seo.seo_structured_data;
        }
    };

    return null; // This component doesn't render anything
};

export default SEOHead;
