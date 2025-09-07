fetch("https://master.dl.sourceforge.net/project/pinn/wallpapers/wallpaper3.jpg?viasf=1", {
  "headers": {
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "upgrade-insecure-requests": "1",
    "Referer": "https://sourceforge.net/projects/pinn/files/wallpapers/wallpaper3.jpg/download"
  },
  "body": null,
  "method": "GET"
}).then(res => res.status).then(console.log).catch(console.error);