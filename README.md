# Gandi DDNS

A simple service that polls your public ip or firewall configuration and updates a set of GANDI dns records.
Currently the following sources are supported:
- API returning the ip as plain text, such as `https://api.ipify.org`
- Sonicwall with SonicOS API enabled. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before you get started, make sure you have installed NodeJS 12 or later.
If you are using a Sonicwall, you also need to make sure that you have enabled the SonicOS API and allows HTTP Basic Authentication. 



### Installing

Clone the repository in your preferred location

```
git clone https://github.com/karlenek/gandi-ddns.git
```

Install all dependencies

```
cd ./gandi-ddns
npm install
```

Before you can run the application you need to setup a configuration. 

The application reads the config file from the root working directory. `./config.json`

An example config is located in the project root directory, `./config_example.json`

Please refer to config schema for all available options, `./src/config.js`.

## Running the application

To start the application in normal mode:

```
npm start
```

To run the application watching for file changes:
```
npm run dev
```


## Deployment
TODO
Add additional notes about how to deploy this on a live system

## Notes
TODO
ttl will only update when ip changes


## Authors

* **Karl EK** - [Karlenek](https://github.com/karlenek)


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

