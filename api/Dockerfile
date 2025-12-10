FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt --no-cache-dir

FROM python:3.11-slim
RUN groupadd -r app && useradd -r -g app app
COPY --from=builder /install /usr/local
COPY . /app
WORKDIR /app
RUN chown -R app:app /app
USER app
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
