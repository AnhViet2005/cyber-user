/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ép không lưu cache để sửa lỗi dứt điểm
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    },
                ],
            },
        ];
    },
    // Các cấu hình khác của bạn (nếu có)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

export default nextConfig;
