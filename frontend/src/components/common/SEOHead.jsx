import { useEffect } from "react";

const SEOHead = ({
  title = "Dormn | Verified Zero Brokerage PGs in Noida | Amity, Sector 62 & Tech Parks",
  description = "Book zero brokerage Boys PGs, Girls PGs, and COED rooms in Noida near Amity University, Sector 62, and Knowledge Park with food, Wi-Fi, and 24/7 security. List your PG property online.",
  keywords = "PG in Noida, PG near Amity University Noida, Girls PG Sector 62 Noida, Boys PG Knowledge Park, COED PG Noida, zero brokerage PG Noida, Budget PG in Noida under 6000, Cheap Girls PG Noida with Food, Affordable PG near Amity, Low Cost Student Hostel Noida, PG near Sector 62 Metro Station, PG in Sector 18 Noida, PG in Sector 52 Noida, PG in Sector 63 Noida, PG near Knowledge Park 2 Greater Noida, PG for Working Professionals Noida, PG near Advant Navis IT Park, Executive Boys PG Sector 62, Single Occupancy Room PG Noida, Luxury Coliving Space Noida, PG with Mess Food Noida, AC PG in Noida, PG with Attached Washroom Sector 62, PG listing platform for owners Noida, List PG online zero brokerage, PG management software for owners, PG rent collection app, Digital tenant KYC registration PG, PG near Jaypee Institute JIIT Noida, PG near Galgotias University, PG near Sharda University Greater Noida, PG near Bennett University, PG near Stellar IT Park Sector 62, PG near Candor TechSpace Noida, PG near Logix Cyber Park",
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