export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  cardTitle: string;
  cardExcerpt: string;
  featured?: boolean;
}

export const blogPosts: BlogPostMeta[] = [
  {
    slug: 'how-to-extract-the-perfect-frame-from-your-videos-a-step-by-step-guide',
    title: 'How to Extract the Perfect Frame from Your Videos: Step-by-Step Guide - Video to Image Converter',
    description: 'Learn how to extract frames from videos using our free video to image converter. Step-by-step guide covering manual capture, interval extraction, and smart scene detection. Convert video to JPG, PNG online free.',
    category: 'Featured guide',
    readTime: '8 min read',
    cardTitle: 'How to Extract the Perfect Frame from Your Videos',
    cardExcerpt: 'Learn the exact steps to capture high-quality frames from any video using our client-side tool. From manual capture to smart scene detection, we cover all extraction methods.',
    featured: true,
  },
  {
    slug: 'why-client-side-video-processing-matters-for-your-privacy',
    title: 'Why Client-Side Video Processing Matters for Your Privacy - Video to Image Converter Blog',
    description: 'Learn why client-side video processing is essential for privacy when using a video to image converter. Discover how our tool ensures your videos never leave your browser while converting video to JPG, PNG, and other formats.',
    category: 'Privacy & security',
    readTime: '6 min read',
    cardTitle: 'Why Client-Side Video Processing Matters for Your Privacy',
    cardExcerpt: 'Discover why processing videos entirely in your browser is crucial for protecting sensitive content and maintaining complete control over your media files.',
  },
  {
    slug: 'top-5-creative-uses-for-extracted-video-frames-in-design-projects',
    title: 'Top 5 Creative Uses for Extracted Video Frames in Design Projects - Video to Image Converter Blog',
    description: 'Discover the top 5 creative ways to use extracted video frames in your design projects. Learn how our video to image converter helps designers create mood boards, digital art, and more using frames from any video.',
    category: 'Creative applications',
    readTime: '5 min read',
    cardTitle: 'Top 5 Creative Uses for Extracted Video Frames',
    cardExcerpt: 'From mood boards to digital art, explore innovative ways to incorporate video frames into your creative workflow and design projects.',
  },
  {
    slug: 'understanding-video-formats-when-to-use-png-vs-jpg-vs-webp-vs-avif',
    title: 'Understanding Video Formats: When to Use PNG vs JPG vs WebP vs AVIF - Video to Image Converter Blog',
    description: 'Learn how to choose the right output format for your extracted frames. Compare PNG, JPG, WebP, and AVIF for quality, file size, and use cases when using our video to image converter. Find the perfect format for your video to JPG converter or video to PNG converter needs.',
    category: 'Technical guide',
    readTime: '7 min read',
    cardTitle: 'When to Use PNG vs JPG vs WebP vs AVIF',
    cardExcerpt: 'A comprehensive guide to choosing the right output format for your extracted frames based on quality, file size, and use case requirements.',
  },
  {
    slug: 'from-video-to-art-turning-frames-into-digital-masterpieces',
    title: 'From Video to Art: Turning Frames into Digital Masterpieces - Video to Image Converter Blog',
    description: 'Learn how to transform ordinary video frames into stunning digital artwork. Discover creative techniques for using our video to image converter to create digital masterpieces from extracted frames, perfect for artists and designers.',
    category: 'Creative transformation',
    readTime: '6 min read',
    cardTitle: 'From Video to Art: Turning Frames into Digital Masterpieces',
    cardExcerpt: 'Learn how to transform ordinary video frames into stunning digital artwork using simple editing techniques and free online tools.',
  },
];
