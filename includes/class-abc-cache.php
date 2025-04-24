<?php
class ABC_Cache {
    private static $cache_group = 'abc_banners';
    private static $cache_time = 12 * HOUR_IN_SECONDS; // 12 hours cache

    public static function get_banner($slug) {
        $cache_key = 'banner_' . md5($slug);
        $banner = wp_cache_get($cache_key, self::$cache_group);

        if (false === $banner) {
            $banner = ABC_DB::get_banner($slug);
            if ($banner) {
                self::set_banner_cache($slug, $banner);
            }
        }
        return $banner;
    }

    public static function set_banner_cache($slug, $banner) {
        $cache_key = 'banner_' . md5($slug);
        wp_cache_set($cache_key, $banner, self::$cache_group, self::$cache_time);
    }

    public static function clear_banner_cache($slug) {
        $cache_key = 'banner_' . md5($slug);
        wp_cache_delete($cache_key, self::$cache_group);
    }

    public static function preload_banners() {
        $banners = ABC_DB::get_all_banners();
        foreach ($banners as $banner) {
            self::set_banner_cache($banner->slug, $banner);
        }
    }

    public static function register_hooks() {
        add_action('save_post', array(__CLASS__, 'clear_post_banners_cache'));
        add_action('abc_banner_updated', array(__CLASS__, 'handle_banner_update'));
    }

    public static function handle_banner_update($banner_id) {
        $banner = ABC_DB::get_banner_by_id($banner_id);
        if ($banner) {
            self::clear_banner_cache($banner->slug);
        }
    }

    public static function clear_post_banners_cache($post_id) {
        $post = get_post($post_id);
        if (has_shortcode($post->post_content, 'abc_banner')) {
            preg_match_all('/\[abc_banner\s+slug=["\']([^"\']+)["\']/', $post->post_content, $matches);
            if (!empty($matches[1])) {
                foreach (array_unique($matches[1]) as $slug) {
                    self::clear_banner_cache($slug);
                }
            }
        }
    }
}