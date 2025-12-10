FROM alpine AS builder
WORKDIR /src
COPY . /src

FROM nginx:alpine
COPY --from=builder /src /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# nginx:alpine runs as nginx user (uid 101) by default in recent versions
# We keep default user for compatibility with read_only + tmpfs setup
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
