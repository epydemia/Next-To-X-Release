<p align="center"><img src="img/logo.png" alt="Next-To-X" width="240"></p>

# Next-To-X

**Next-To-X** is a lightweight web app for driving on highways in Italy, Germany, Switzerland and Austria: it follows your GPS position and heading and shows the next EV charging station ahead of you, on your side of the highway.

Live: **[nexttox.com](https://nexttox.com)**

This repository holds the published version of the app: the pages, the scripts and the compiled station data (`data/aree.json`). It is updated automatically from the development repository, which is private, so **pull requests here cannot be merged directly**: if you find a bug or a wrong station, please [open an issue](../../issues).

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Driving app: map, next station, distance bar, nearby stations list |
| `info.html` | Info and privacy |
| `stazioni.html` | Station browser and editor |
| `autostrade.html` | Overview of stations along a highway, split by carriageway |

## Running locally

The pages load ES modules and JSON, so they need an HTTP server:

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Publishing

Every push to `main` is published on GitHub Pages by `.github/workflows/static.yml`. Before uploading, `tools/versiona_asset.py` adds `?v=<commit>` to the CSS and scripts of the pages and to every relative module import, so browsers fetch the new files at once instead of waiting for the GitHub Pages cache.

## License

- **App code**: MIT, see [`LICENSE`](LICENSE).
- **Data** in `data/`: see [`data/README.md`](data/README.md). Parts derived from OpenStreetMap are © OpenStreetMap contributors, ODbL 1.0.

Next-To-X is an independent project, not affiliated with Free To X, Autostrade per l'Italia, Autostrada del Brennero or any charging operator.
