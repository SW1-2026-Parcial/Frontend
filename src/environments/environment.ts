export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  onlyofficeUrl: 'http://localhost:8088',
  buildTime: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
};
