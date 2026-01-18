IMAGE_NAME=resume-builder
# Detect if running on Windows (OS is usually defined) or Unix
ifdef OS
   PWD_CMD=%cd%
else
   PWD_CMD=$$(pwd)
endif

CONTAINER_CMD=docker run --rm -v "$(PWD_CMD):/data" $(IMAGE_NAME)

# Default target (runs if you just type 'make')
all: compile

build:
	docker build -t $(IMAGE_NAME) .

compile:
	$(CONTAINER_CMD)

clean:
	# Removes intermediate files but keeps the PDF
	rm -f *.aux *.log *.out *.fls *.fdb_latexmk *.upa *.upb

pristine: clean
	# Removes everything including the PDF
	rm -f *.pdf