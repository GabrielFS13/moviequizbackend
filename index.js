require('dotenv').config()
const express = require("express")
const app = express()
var cors = require('cors')
const { Configuration, OpenAIApi } = require("openai");
const PORT = process.env.PORT || 3002
const API_KEY = process.env.API_KEY
const MOVIE_KEY = process.env.API_MDB


const config = new Configuration({
    apiKey: API_KEY
})

const openai = new OpenAIApi(config)

async function pegaEmoji(pergunta){

    const resposta = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Você vai receber um título de um filme e a sinpse, e deve traduzir para emojis: '${pergunta}'.`,
        max_tokens: 100,
        temperature: 0.8
    }); 

    return resposta.data.choices[0].text
    
}

async function pegaFilme(genero_id){
    const movieID = Math.floor(Math.random() * 50 + 1)
    const movieIndex = Math.floor(Math.random() * 19 + 1)
    if(genero_id){
        conexaoString = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_KEY}&language=pt-BR&page=${movieID}&with_genres=${genero_id}`
    }else{
        conexaoString = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_KEY}&language=pt-BR&page=${movieID}`
    }
    const conexao = await fetch(conexaoString).catch(err => console.log(err))
    const dados = await conexao.json()
    return dados.results[movieIndex]
}

async function pegaIdFilme(id){

    const conexao = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${MOVIE_KEY}&language=pt-BR`)
    const data = await conexao.json()

    return data.genres

}

async function montaQuiz(gen_id = false){
    var filme = await pegaFilme(gen_id)
    var emojis = await pegaEmoji(filme.overview, filme.title) 
    var genre = await pegaIdFilme(filme.id)
 
    while(emojis === "\n\n🤷‍♂️" || emojis === "\n\n❓" || emojis == "\n\n🤔🤷‍♂️🤷‍♀️" || filme.overview === ''){
        filme = await pegaFilme(gen_id)
        emojis = await pegaEmoji(filme.overview, filme.title)
        genre = await pegaIdFilme(filme.id)
    }


    return {emojis, 
            hints: {
            release_date: filme.release_date,
            overview: filme.overview.slice(0, 50),
            genre: genre
        },
        poster: 'https://image.tmdb.org/t/p/original/'+filme.poster_path,
        answer: filme.title,
        original: filme.original_title
    }
}

app.use(cors())


app.get('/',cors(), async (req, res) =>{
    res.json(await montaQuiz())
})

app.get('/genero/:id',cors(), async (req, res) =>{
    res.json(await montaQuiz(req.params.id))
})


app.listen(PORT, () =>{
    console.log("Server ON!", PORT)
})