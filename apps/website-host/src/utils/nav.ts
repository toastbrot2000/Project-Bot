export const getNavLinks = (pathname: string) => {
    return [
      { label: 'Home', href: '/', active: pathname === '/' },
      { label: 'User App', href: '/app', active: pathname.startsWith('/app') },
      { label: 'Admin', href: '/admin', active: pathname.startsWith('/admin') },
      { label: 'CMS', href: 'http://localhost:1337/admin', target: '_blank', active: false },
    ];
};
