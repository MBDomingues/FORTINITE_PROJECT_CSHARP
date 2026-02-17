using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fortinite_Project.Web.Data;
using Fortinite_Project.Web.Models;
using Fortinite_Project.Web.DTOs;

namespace Fortinite_Project.Web.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("cadastro")]
    public async Task<ActionResult<BaseResponse_DTO<UsuarioRespostaDTO>>> Registrar(RegistroUsuarioDTO request)
    {
        if (await _context.Usuarios.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new BaseResponse_DTO 
            { 
                Status = 400, 
                Message = "Este email já está cadastrado." 
            });
        }

        var novoUsuario = new Usuario
        {
            Nome = request.Nome,
            Email = request.Email,
            Senha = request.Senha,
            creditos = 10000,
            DataCadastro = DateTime.Now
        };

        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        var dadosRetorno = new UsuarioRespostaDTO
        {
            Id = novoUsuario.Id,
            Nome = novoUsuario.Nome,
            Email = novoUsuario.Email,
            Creditos = novoUsuario.creditos,
            Token = novoUsuario.Id.ToString()
        };

        return StatusCode(201, new BaseResponse_DTO<UsuarioRespostaDTO>
        {
            Status = 201,
            Message = "Usuário cadastrado com sucesso.",
            Data = dadosRetorno
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<BaseResponse_DTO<UsuarioRespostaDTO>>> Login(LoginDTO request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario == null || usuario.Senha != request.Senha)
        {
            return Unauthorized(new BaseResponse_DTO 
            { 
                Status = 401, 
                Message = "Email ou senha incorretos." 
            });
        }

        var dadosRetorno = new UsuarioRespostaDTO
        {
            Id = usuario.Id,
            Nome = usuario.Nome,
            Email = usuario.Email,
            Creditos = usuario.creditos,
            Token = usuario.Id.ToString()
        };

        return Ok(new BaseResponse_DTO<UsuarioRespostaDTO>
        {
            Status = 200,
            Message = "Login realizado com sucesso.",
            Data = dadosRetorno
        });
    }
}