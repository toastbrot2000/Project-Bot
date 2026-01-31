export const getNavLinks = (pathname: string) => {
    return [
      { label: 'Home', href: '/', active: pathname === '/' },
      { label: 'User App', href: '/app', active: pathname.startsWith('/app') },
      { label: 'Logic Modeller', href: '/logic-modeller', active: pathname.startsWith('/logic-modeller') },
      { label: 'CMS', href: 'http://localhost:1337/admin', target: '_blank', active: false },
    ];
};
