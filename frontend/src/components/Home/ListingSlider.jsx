const ListingSlider = ({ children }) => {
  return (
    <div
      className="
        flex gap-3 sm:gap-4 md:gap-6
        overflow-x-auto overflow-y-hidden
        pb-4 px-1
        scrollbar-hide
        snap-x snap-mandatory
        scroll-smooth
        [-webkit-overflow-scrolling:touch]
        md:grid md:grid-cols-2 md:overflow-visible md:px-0
        xl:grid-cols-3
      "
    >
      {children}
    </div>
  );
};

export default ListingSlider;
