FROM public.ecr.aws/lambda/python:3.11
ENV PYTHONDONTWRITEBYTECODE=1 PIP_DISABLE_PIP_VERSION_CHECK=1
COPY requirements.txt .
RUN python -m pip install --upgrade pip wheel setuptools \
 && pip install --no-cache-dir --only-binary=:all: -r requirements.txt
COPY . .
CMD ["app.handler"]
