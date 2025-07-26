FROM mysql:latest
ADD sample-data.sql /docker-entrypoint-initdb.d/sample-data.sql
EXPOSE 3306
CMD ["mysqld"]