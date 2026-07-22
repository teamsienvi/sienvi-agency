import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

export const SEOHead = ({
  title,
  description,
  canonical,
  noindex = false,
  ogImage = "https://sienvi-agency-landing-page.lovable.app/og-image.png",
  ogType = "website",
}: SEOHeadProps) => {
  useEffect(() => {
    // Update Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper to update or create link tags
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // Meta Description
    setMetaTag('meta[name="description"]', "name", "description", description);

    // Robots meta tag
    setMetaTag('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    // OpenGraph Meta
    setMetaTag('meta[property="og:title"]', "property", "og:title", title);
    setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    setMetaTag('meta[property="og:type"]', "property", "og:type", ogType);
    setMetaTag('meta[property="og:image"]', "property", "og:image", ogImage);

    // Twitter Meta
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", ogImage);

    // Canonical link
    if (canonical) {
      setLinkTag("canonical", canonical);
    }
  }, [title, description, canonical, noindex, ogImage, ogType]);

  return null;
};

export default SEOHead;
