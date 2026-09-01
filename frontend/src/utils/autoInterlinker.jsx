import { Link } from "react-router-dom";

export const renderInterlinkedContent = (text) => {
  if (!text) return null;

  const linkRules = [
    { keyword: "Dormn Noida Search", url: "/pgs?city=Noida" },
    { keyword: "Sector 62 Noida PGs", url: "/pgs?city=Noida&area=Sector%2062" },
    { keyword: "Knowledge Park PGs", url: "/pgs?city=Noida&area=Knowledge%20Park" },
    { keyword: "Girls PG near Amity University", url: "/pgs?city=Noida&type=Girls" },
    { keyword: "Boys PG in Noida Sector 125", url: "/pgs?city=Noida&type=Boys" },
    { keyword: "COED PG in Sector 62", url: "/pgs?city=Noida&type=COED" },
    { keyword: "Sector 62", url: "/pgs?city=Noida&area=Sector%2062" },
    { keyword: "Knowledge Park", url: "/pgs?city=Noida&area=Knowledge%20Park" },
    { keyword: "Noida", url: "/pgs?city=Noida" }
  ];

  let parts = [text];

  linkRules.forEach(({ keyword, url }) => {
    const newParts = [];
    parts.forEach((part) => {
      if (typeof part !== "string") {
        newParts.push(part);
        return;
      }

      const regex = new RegExp(`(${keyword})`, "gi");
      const subParts = part.split(regex);

      subParts.forEach((subPart, i) => {
        if (subPart.toLowerCase() === keyword.toLowerCase()) {
          newParts.push(
            <Link
              key={i + url}
              to={url}
              className="font-semibold text-[#E56A54] underline hover:text-black transition-colors"
            >
              {subPart}
            </Link>
          );
        } else {
          newParts.push(subPart);
        }
      });
    });
    parts = newParts;
  });

  return parts;
};