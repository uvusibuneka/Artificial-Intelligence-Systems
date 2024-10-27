% --- Факты с одним аргументом ---

% Определяем игроков
player(kasparov).
player(karpov).
player(fischer).
player(spassky).
player(tal).
player(botvinnik).
player(alehin).
player(lasker).
player(capablanca).
player(petrosian).
player(morphy).
player(kramnik).
player(anand).
player(carlsen).
player(karjakin).
player(nepomniachtchi).
player(ding).
player(nakamura).
player(so).
player(grischuk).

% Определяем стили игры
style(aggressive).
style(positional).
style(endgame_specialist).
style(tactical).
style(strategic).
style(unpredictable).

% Определяем турниры
tournament(candidates_1971).
tournament(world_championship_1972).
tournament(world_championship_1984).
tournament(world_championship_1985).
tournament(world_championship_2000).
tournament(world_championship_2008).
tournament(world_championship_2013).
tournament(world_championship_2016).
tournament(world_championship_2021).
tournament(world_championship_2023).

% --- Факты с двумя аргументами ---

% Связь между игроками и их стилями
playing_style(kasparov, aggressive).
playing_style(karpov, positional).
playing_style(fischer, tactical).
playing_style(spassky, strategic).
playing_style(tal, unpredictable).
playing_style(botvinnik, strategic).
playing_style(anand, endgame_specialist).
playing_style(carlsen, strategic).
playing_style(ding, tactical).
playing_style(nakamura, tactical).

% Участники турниров
participated(kasparov, world_championship_1985).
participated(karpov, world_championship_1985).
participated(fischer, world_championship_1972).
participated(spassky, world_championship_1972).
participated(tal, candidates_1971).
participated(botvinnik, world_championship_1961).
participated(anand, world_championship_2008).
participated(kramnik, world_championship_2000).
participated(carlsen, world_championship_2013).
participated(ding, world_championship_2023).

% Результаты матчей в турнирах
match_result(kasparov, karpov, world_championship_1985, kasparov_win).
match_result(fischer, spassky, world_championship_1972, fischer_win).
match_result(kramnik, kasparov, world_championship_2000, kramnik_win).
match_result(anand, kramnik, world_championship_2008, anand_win).
match_result(carlsen, anand, world_championship_2013, carlsen_win).
match_result(ding, nepo, world_championship_2023, ding_win).

% --- Правила ---

% Определяем правило для поиска победителя матча
winner(Player, Opponent, Tournament) :-
    match_result(Player, Opponent, Tournament, Player_win).

% Определяем правило для агрессивных игроков
aggressive_player(Player) :-
    playing_style(Player, aggressive).

% Определяем правило для нахождения игроков, победивших в турнире
tournament_winner(Player, Tournament) :-
    winner(Player, _, Tournament).

% Определяем правило для подсчета побед игрока
player_wins(Player, Count) :-
    findall(Tournament, tournament_winner(Player, Tournament), Wins),
    length(Wins, Count).

% Определяем правило для поиска игроков с определенными стилями
players_with_style(Style, Players) :-
    findall(Player, playing_style(Player, Style), Players).

% Определяем правило для нахождения игроков, участвовавших в турнире, но не победивших
participated_but_not_won(Player, Tournament) :-
    participated(Player, Tournament),
    \+ tournament_winner(Player, Tournament).

