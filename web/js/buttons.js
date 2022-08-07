document.getElementById("spotify_button").onclick = function () {
  location.href = "/auth?type=spotify";
};

document.getElementById("arknights_module_button").onclick = function () {
  location.href = "/arknights/modules";
};

document.getElementById("mal_button").onclick = function () {
  location.href = "/auth?type=mal";
};
