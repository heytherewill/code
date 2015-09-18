window.onload = function windowOnload() {
	
	var fields = [ 'varName', 'name', 'age', 'comment', 'joke', 'profession', 'jobTitle', 'location', 'country', 'languages', 'pt', 'en', 'it', 'fr' ]
				.map(function mapFields(field){ return document.getElementById(field); }),
		i18n = {
			ptBR: [ 'eu', 'nome', 'idade', 'Isso é', 'em não-programador', 'profissao', 'desenvolvedor de software', 'localizacao', 'SP, Brasil', 'idiomas', 'português', 'inglês', 'italiano', 'francês' ],
			frFR: [ 'moi', 'nom', 'age', "C'est", 'en non-programmeur', 'profession', 'developpeur software', 'location', 'SP, Brésil', 'languages', 'portugais', 'anglais', 'italien', 'français'  ],
			itIT: [ 'io', 'nome', 'eta', 'Questo è', 'in non-sviluppatore', 'professione ', 'sviluppatore software', 'localizzazione', 'SP, Brasile', 'lingue', 'portoghese', 'inglese', 'italiano', 'francese'  ],
			enUS: [ 'me', 'name', 'age', "That's", 'in non-programmer', 'profession', 'software developer', 'location', 'SP, Brazil', 'languages', 'portuguese', 'english', 'italian', 'french' ]
		};
		
	window.onhashchange = onHashChange;
	
	function onHashChange() {	
		var language = window.location.hash.substr(1);
		
		if(i18n[language]) {
			fields.forEach(function changeLanguage(span, i){
				span.style.opacity = 0;
				span.innerHTML = i18n[language][i];
				span.style.opacity = 1;
			});
		}
	}
	
	var birthday = new Date(1992, 10, 16),
		diff = new Date(Date.now() - birthday.getTime()),
		age = Math.abs(diff.getUTCFullYear() - 1970);
		
	document.getElementById('years').innerHTML = age;
	
	if(location.hash && location.hash != '') {
		onHashChange();
	}
}