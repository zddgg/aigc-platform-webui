FROM nginx

COPY --chown=nginx:nginx dist /usr/share/nginx/html
COPY /default.conf /etc/nginx/conf.d/

WORKDIR /usr/share/nginx/html
