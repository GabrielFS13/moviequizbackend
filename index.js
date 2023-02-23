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
        prompt: `Descreva o seguinte filme em emojis: '${pergunta}'.`,
        max_tokens: 100,
        temperature: 0.8
    });

    return resposta.data.choices[0].text
    
}

async function pegaFilme(){
    const movieID = Math.floor(Math.random() * 50 + 1)
    const movieIndex = Math.floor(Math.random() * 19 + 1)
    const conexao = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_KEY}&language=pt-BR&page=${movieID}`).catch(err => console.log(err))
    const dados = await conexao.json()
    return dados.results[movieIndex]
}

async function pegaIdFilme(id){

    const conexao = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${MOVIE_KEY}&language=pt-BR`)
    const data = await conexao.json()

    return data.genres

}

async function montaQuiz(){
    var filme = await pegaFilme()
    var emojis = await pegaEmoji(filme.title) 
    var genre = await pegaIdFilme(filme.id)
 
    while(emojis === "\n\n🤷‍♂️" || emojis === "\n\n❓" || emojis == "\n\n🤔🤷‍♂️🤷‍♀️"){
        filme = await pegaFilme()
        emojis = await pegaEmoji(filme.title)
        genre = await pegaIdFilme(filme.id)
    }


    return {emojis, 
            hints: {
            release_date: filme.release_date,
            overview: filme.overview,
            genre: genre
        },
        poster: 'https://image.tmdb.org/t/p/original/'+filme.poster_path,
        answer: filme.title
    }
}

app.use(cors())


app.get('/', async (req, res) =>{
    res.json(await montaQuiz())
})



app.listen(PORT, () =>{
    console.log("Server ON!", PORT)
})