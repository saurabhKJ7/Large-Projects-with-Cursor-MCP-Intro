import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className,
  style,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const cdnUrl = process.env.REACT_APP_IMAGE_CDN_URL;
  const imageUrl = cdnUrl ? `${cdnUrl}/${src}` : src;

  return (
    <Box position="relative" width={width} height={height}>
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width={width}
          height={height}
          animation="wave"
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      <LazyLoadImage
        src={imageUrl}
        alt={alt}
        effect="blur"
        afterLoad={() => setIsLoading(false)}
        width={width}
        height={height}
        className={className}
        style={{
          objectFit: 'cover',
          ...style,
        }}
        wrapperProps={{
          style: {
            width: '100%',
            height: '100%',
          },
        }}
      />
    </Box>
  );
};

export default LazyImage; 