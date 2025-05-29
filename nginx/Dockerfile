FROM alpine:3.18

RUN apk update && apk upgrade && apk add --no-cache nginx openssl

RUN mkdir -p /etc/nginx/ssl /run/nginx /var/www/html

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY tools/nginx.cert /etc/nginx/ssl/nginx.cert
COPY tools/nginx.key /etc/nginx/ssl/nginx.key

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
