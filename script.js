var firebaseConfig = {
  apiKey: "AIzaSyBm3yO2RhZAO8mCkc6trCKXcEsVGdCROL4",
  authDomain: "githubproject1-576e6.firebaseapp.com",
  databaseURL: "https://githubproject1-576e6.firebaseio.com",
  projectId: "githubproject1-576e6",
  storageBucket: "githubproject1-576e6.appspot.com",
  messagingSenderId: "899132439339",
  appId: "1:899132439339:web:87f49fe6895948645ea36e"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

let db = firebase.database();
let green = '#64e89d';
let yellow = '#ffff80';
let red = '#ff8080';
let bgcolor = 'transparent';

function setFeedback(message, color) {
  $('#feedback').text(message);
  $('#feedback').css('background-color', color);
}

//sets a word and its rhymes in database
function setRandomWord() {
  db.ref('words').on('value', ss2 => {
    let random = Math.floor(Math.random() * ss2.numChildren());
    let word = ss2.val()[random];
    db.ref('word').set(word).then(() => {
      setRhymes(word);
    });
  }); //end ss2
}

function setRhymes(word) {
  db.ref('rhymes').remove().then(() => {
    $.ajax({
      url: "https://api.datamuse.com/words?md=d&rel_rhy=" + word,
      headers: { "Accept": "application/json" },
      success: function (data) {
        for (let i = 0; i < 8; i++) {
          let wordObj = data[i];
          wordObj.found = false;
          db.ref('rhymes').push(wordObj);
        }
      }
    });
  });
}

//when word changes, display value
db.ref('word').on('value', ss => {
  $("#word").text(ss.val().toUpperCase());
});

//when new rhymes are added, display the rhymes
db.ref('rhymes').on('child_added', ss => {
  let wordData = ss.val();
  let wordKey = ss.key;
  let word = wordData.word;
  let wordDef = wordData.defs[0];

  if (wordData.found) {
    $('#rhymes').append(`<li id='${wordKey}' class='found'> <p class='word'>${word}</p> ${wordDef} </li>`);
  } else {
    $('#rhymes').append(`<li id='${wordKey}'>${wordDef}</li>`);
  }

});

// $("img").attr("width","500");

/*when submit is clicked, look for word among rhymes
 *if found, set it's found var to true. clear input
 */
$('#submit').on('click', function () {
  let iword = $('#wordinput').val().toLowerCase();

  db.ref('rhymes').orderByChild('word').equalTo(iword).once('value', ss => {
    if (ss.exists()) {
      ss.forEach(childss => {   //need for to access
        console.log(childss.val());
        if (childss.val().found == false) {
          db.ref('rhymes').child(childss.key).child('found').set(true);
          setFeedback('Found a new rhyme!', green);
        } else {
          setFeedback('Rhyme already found', yellow);
        }
      });
    } else {
      setFeedback('Word not found', red);
    }
  });
  $('#wordinput').val('');
});

$('#wordinput').on('focus', function () {
  setFeedback('', bgcolor);
});


//when rhyme is changed and marked found, display it differently
db.ref('rhymes').on('child_changed', ss => {
  if (ss.exists()) {
    console.log(ss.key);
    $('#' + ss.key).addClass("found");
    $("#" + ss.key).prepend(`<p class='word'>${ss.val().word}</p>`);
  }
});

//if all rhymes have been found, restart game
db.ref('rhymes').orderByChild('found').equalTo(false).on('value', ss => {
  if (!ss.exists()) {
    //alert('all words found');
    db.ref('session').set('inactive');
  }
});

$('#end').on('click', function(){
  db.ref('session').set('active');
  setRandomWord();
})



db.ref('session').on('value', ss => {
  if(ss.val() == 'active'){
    $('#end').css('display', 'none');
  }else{
    $('#rhymes').html('');
    $('#end').css('display', 'block');
  }
});
/*
//note
var arr = data;
let f = data.find(item => item.word.length == 6);
arr.filter(item => item.word.length == 6); //set another var word => word.length = 6);
alert(JSON.stringify(f));
$().append('<li>S{word} </li>')

*/
