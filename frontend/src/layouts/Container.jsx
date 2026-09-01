const Container = ({ children, className = "" }) => {
    return (
      <div
        className={`mx-auto w-full max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10 ${className}`}
      >
        {children}
      </div>
    );
  };
  
  export default Container;