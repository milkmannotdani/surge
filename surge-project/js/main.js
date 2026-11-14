/* Starts the game. Loaded last, after every other file. */
buildGfx();if(!GFX.high)lampConeMat.visible=false;initPreview();makePortraits();$('load').style.display='none';showScreen('title');loop();
