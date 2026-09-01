import { useEffect } from "react";

const SEOHead = ({
  title = "Dormn | Verified PGs in Noida | Near Amity, Sector 62 & Tech Parks",
  description = "Book zero brokerage Boys PGs, Girls PGs, and COED rooms in Noida near Amity University, Sector 62, and Knowledge Park with food, Wi-Fi, and security.",
  keywords = "PG in Noida, PG near Amity University Noida, Girls PG Sector 62 Noida, Boys PG Knowledge Park, COED PG Noida, zero brokerage PG Noida",
  canonicalUrl = "https://dormn.com",
  ogImage = "https://dormn.com/logo.jpg",
  schema = null,
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // 2. Helper to set meta tags
    const setMetaTag = (nameAttr, nameValue, content) => {
      let element = document.querySelector(`meta[${nameAttr}="${nameValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(nameAttr, nameValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "keywords", keywords);

    // Open Graph Tags
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:url", canonicalUrl);

    // Twitter Tags
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", ogImage);

    // Canonical Tag
    let canonicalElement = document.querySelector("link[rel='canonical']");
    if (!canonicalElement) {
      canonicalElement = document.createElement("link");
      canonicalElement.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute("href", canonicalUrl);

    // 3. Dynamic JSON-LD Schema Insertion (Crucial for AI Engines & Google Rich Snippets)
    const schemaId = "dormn-jsonld-schema";
    let scriptElement = document.getElementById(schemaId);
    if (scriptElement) {
      scriptElement.remove();
    }

    if (schema) {
      scriptElement = document.createElement("script");
      scriptElement.id = schemaId;
      scriptElement.type = "application/ld+json";
      scriptElement.text = JSON.stringify(schema);
      document.head.appendChild(scriptElement);
    }
  }, [title, description, keywords, canonicalUrl, ogImage, schema]);

  return null;
};

export default SEOHead;