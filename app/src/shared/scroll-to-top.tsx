import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({
  elementRef
}: {
  elementRef: React.RefObject<HTMLElement>;
}) => {
  const location = useLocation();

  useEffect(() => {
    if (elementRef?.current) {
      elementRef.current.scrollTo({
        top: 0,
        left: 0
      });
    }
  }, [location.pathname, elementRef]);

  return <></>;
};

export default ScrollToTop;
